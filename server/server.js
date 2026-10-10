require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs/promises");

const app = express();

const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("ERROR: JWT_SECRET is missing in .env");
    process.exit(1);
}

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("ERROR: MONGO_URI is missing in .env");
    process.exit(1);
}

const mongoClient = new MongoClient(MONGO_URI);

// ======================================================
// PATHS
// ======================================================

const projectRoot = path.resolve(__dirname, "..");

const dsaDirectory = path.join(
    projectRoot,
    "dsa"
);

const studentsFile = path.join(
    dsaDirectory,
    "students.txt"
);

const cppExeCandidates = [
    path.join(dsaDirectory, "student_list.exe"),
    path.join(dsaDirectory, "student_list"),
];

let cppEngine = null;

// ======================================================
// MONGODB
// ======================================================

let db;
let studentsCollection;
let usersCollection;
let undoCollection;
let redoCollection;
let requestsCollection;

// ======================================================
// EXPRESS
// ======================================================

app.use(cors());
app.use(express.json());

// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
}
// ADD THIS BELOW authenticateToken

function requireTeacher(req, res, next) {
    if (req.user.role !== "teacher") {
        return res.status(403).json({
            success: false,
            message: "Teacher access required.",
        });
    }

    next();
}

function getDataOwnerId(req) {
    if (req.user.role === "student") {
        return req.user.teacherId;
    }

    return req.user.userId;
}

// ======================================================
// TEACHER REGISTER
// ======================================================

app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await usersCollection.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await usersCollection.insertOne({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "teacher",
            createdAt: new Date(),
        });

        res.status(201).json({
            success: true,
            message: "Teacher registered successfully.",
            userId: result.insertedId,
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed.",
        });
    }
});


// ===============================
// STUDENT REGISTRATION
// ===============================
app.post("/api/auth/student-register", async (req, res) => {
    try {
        const { email, rollNo, password } = req.body;

        if (!email || !rollNo || !password) {
            return res.status(400).json({
                success: false,
                message: "Email, roll number and password are required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const numericRollNo = Number(rollNo);

        if (!Number.isInteger(numericRollNo)) {
            return res.status(400).json({
                success: false,
                message: "Roll number must be a valid number.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
        }

        // Find the student created by a teacher
        const student = await studentsCollection.findOne({
            email: normalizedEmail,
            rollNo: numericRollNo,
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student record not found. Please contact your teacher.",
            });
        }

        // Check whether account already exists
        const existingUser = await usersCollection.findOne({
            email: normalizedEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email.",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // IMPORTANT:
        // teacherId comes directly from the student's existing record.
        await usersCollection.insertOne({
            name: student.name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "student",
            studentRollNo: student.rollNo,
            teacherId: student.teacherId,
            createdAt: new Date(),
        });

        return res.status(201).json({
            success: true,
            message: "Student account created successfully.",
        });
    } catch (error) {
        console.error("Student registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during student registration.",
        });
    }
});

// ======================================================
// TEACHER LOGIN
// ======================================================

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await usersCollection.findOne({
            email: normalizedEmail,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                email: user.email,
                role: user.role,
                ...(user.role === "student"
                    ? {
                        studentRollNo:
                            Number(user.studentRollNo),
                        teacherId: user.teacherId,
                    }
                    : {}),
            },
            JWT_SECRET,
            {
                expiresIn: "1d",
            }
        );

        res.json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
                ...(user.role === "student"
                    ? {
                        studentRollNo:
                            Number(user.studentRollNo),
                        teacherId: user.teacherId,
                    }
                    : {}),
            },
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Login failed.",
        });
    }
});

// ======================================================
// DATABASE CONNECTION
// ======================================================

async function connectMongoDB() {
    await mongoClient.connect();

    db = mongoClient.db("datanest");

    studentsCollection = db.collection("students");
    usersCollection = db.collection("users");
    undoCollection = db.collection("undo_history");
    redoCollection = db.collection("redo_history");
    requestsCollection = db.collection("requests");
    await requestsCollection.createIndex({
        teacherId: 1,
        createdAt: -1,
    });

    await requestsCollection.createIndex({
        studentRollNo: 1,
        teacherId: 1,
    });
    await studentsCollection.createIndex(
        { teacherId: 1, rollNo: 1 },
        { unique: true }
    );

    await undoCollection.createIndex({
        createdAt: 1,
    });

    await redoCollection.createIndex({
        createdAt: 1,
    });

    console.log("MongoDB connected successfully.");
}

// ======================================================
// FIND C++ EXECUTABLE
// ======================================================

async function findCppEngine() {
    for (const candidate of cppExeCandidates) {
        try {
            await fs.access(candidate);
            cppEngine = candidate;

            console.log(
                "C++ DSA engine:",
                cppEngine
            );

            return;
        } catch {
            // Try next candidate
        }
    }

    throw new Error(
        "student_list executable not found. " +
        "Expected dsa/student_list.exe or dsa/student_list."
    );
}

// ======================================================
// ENSURE DSA DIRECTORY
// ======================================================

async function ensureDsaDirectory() {
    await fs.mkdir(
        dsaDirectory,
        {
            recursive: true,
        }
    );
}

// ======================================================
// CONVERT MONGO STUDENT TO C++ FILE LINE
// ======================================================

function studentToFileLine(student) {
    const rollNo = Number(student.rollNo) || 0;

    const name = String(
        student.name || ""
    );

    const email = String(
        student.email || ""
    );

    const department = String(
        student.department || ""
    );

    const year = String(
        student.year || ""
    );

    const cgpa = Number(
        student.cgpa || 0
    );

    const status = String(
        student.status || "Active"
    );

    return [
        rollNo,
        name,
        email,
        department,
        year,
        cgpa,
        status,
        Number(student.attendance) || 0,
    ].join("|");
}

// ======================================================
// PARSE C++ FILE LINE
// ======================================================

function parseStudentLine(line) {
    const parts = String(line)
        .split("|");

    if (parts.length < 8) {
        return null;
    }

    const rollNo = Number(parts[0]);

    if (Number.isNaN(rollNo)) {
        return null;
    }

    return {
        rollNo,
        name: parts[1] || "",
        email: parts[2] || "",
        department: parts[3] || "",
        year: parts[4] || "",
        cgpa: Number(parts[5]) || 0,
        status: parts[6] || "Active",
        attendance: Number(parts[7]) || 0,
    };
}

// ======================================================
// MONGO -> students.txt
//
// IMPORTANT:
// MongoDB is the permanent datastore.
// students.txt is only the bridge for C++.
// ======================================================

async function syncMongoToCppFile(teacherId) {
    await ensureDsaDirectory();

    const students = await studentsCollection
        .find({
            teacherId,
        })
        .sort({ rollNo: 1 })
        .toArray();

    const content = students
        .map(studentToFileLine)
        .join("\n");

    await fs.writeFile(
        studentsFile,
        content + (content ? "\n" : ""),
        "utf8"
    );

    return students;
}

// ======================================================
// students.txt -> MONGO
//
// C++ writes the final state here.
// Server reads that state and updates MongoDB.
// ======================================================

async function syncCppFileToMongo(teacherId) {
    let content = "";

    try {
        content = await fs.readFile(
            studentsFile,
            "utf8"
        );
    } catch (error) {
        if (error.code === "ENOENT") {
            return [];
        }

        throw error;
    }

    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const students = lines
        .map(parseStudentLine)
        .filter(Boolean);


    const existingStudents =
        await studentsCollection
            .find({
                teacherId,
            })
            .toArray();

    const existingByRollNo =
        new Map(
            existingStudents.map(
                (student) => [
                    Number(student.rollNo),
                    student,
                ]
            )
        );

    const parsedRollNos =
        students.map(
            (student) => Number(student.rollNo)
        );

    // ==================================================
    // Remove students deleted by C++
    // ==================================================

    if (parsedRollNos.length === 0) {
        await studentsCollection.deleteMany({
            teacherId,
        });
    } else {
        await studentsCollection.deleteMany({
            teacherId,
            rollNo: {
                $nin: parsedRollNos,
            },
        });
    }

    // ==================================================
    // Update / insert students
    // ==================================================

    if (students.length > 0) {
        const operations = students.map(
            (student) => ({
                updateOne: {
                    filter: {
                        teacherId,
                        rollNo: Number(
                            student.rollNo
                        ),
                    },

                    update: {
                        $set: {
                            rollNo: Number(
                                student.rollNo
                            ),

                            name: student.name,
                            email: student.email,
                            department:
                                student.department,

                            year: student.year,

                            cgpa: Number(
                                student.cgpa
                            ),

                            status:
                                student.status ||
                                "Active",

                            attendance: Number(student.attendance) || 0,

                        },

                        $setOnInsert: {
                            teacherId,

                        },
                    },

                    upsert: true,
                },
            })
        );

        await studentsCollection.bulkWrite(
            operations,
            {
                ordered: true,
            }
        );
    }

    // ==================================================
    // Return final MongoDB state
    // ==================================================

    return await studentsCollection
        .find({
            teacherId,
        })
        .sort({
            rollNo: 1,
        })
        .toArray();
}

// ======================================================
// RUN C++ ENGINE
// ======================================================

function runCpp(
    args,
    options = {}
) {
    return new Promise(
        (resolve, reject) => {
            if (!cppEngine) {
                reject(
                    new Error(
                        "C++ engine is not initialized."
                    )
                );

                return;
            }

            execFile(
                cppEngine,
                args.map(String),
                {
                    cwd: projectRoot,
                    windowsHide: true,
                    maxBuffer:
                        10 * 1024 * 1024,
                    ...options,
                },
                (
                    error,
                    stdout,
                    stderr
                ) => {
                    const output =
                        String(
                            stdout || ""
                        ).trim();

                    const errorOutput =
                        String(
                            stderr || ""
                        ).trim();

                    if (errorOutput) {
                        console.error(
                            "C++ STDERR:",
                            errorOutput
                        );
                    }

                    if (
                        error &&
                        !output
                    ) {
                        reject(
                            new Error(
                                error.message +
                                (
                                    errorOutput
                                        ? `: ${errorOutput}`
                                        : ""
                                )
                            )
                        );

                        return;
                    }

                    resolve({
                        output,
                        stderr: errorOutput,
                        error,
                    });
                }
            );
        }
    );
}

// ======================================================
// PARSE NORMAL STUDENT OUTPUT
// ======================================================

function parseStudentOutput(
    output
) {
    const lines = String(output)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    return lines
        .map(parseStudentLine)
        .filter(Boolean);
}

// ======================================================
// PARSE SEARCH OUTPUT
// ======================================================

function parseSearchOutput(
    output,
    algorithm
) {
    const parts = String(output)
        .trim()
        .split("|");

    if (
        parts[0] ===
        "NOT_FOUND"
    ) {
        return {
            success: true,
            found: false,
            comparisons:
                Number(parts[1]) || 0,
            algorithm,
        };
    }

    if (
        parts[0] ===
        "FOUND"
    ) {
        return {
            success: true,
            found: true,

            student: {
                rollNo:
                    Number(parts[1]),
                name:
                    parts[2] || "",
                email:
                    parts[3] || "",
                department:
                    parts[4] || "",
                year:
                    parts[5] || "",
                cgpa:
                    Number(parts[6]) || 0,
                status:
                    parts[7] || "Active",
                attendance: Number(parts[8]) || 0,
            },

            comparisons:
                Number(parts[9]) || 0,

            algorithm,
        };
    }

    throw new Error(
        "Unexpected search output: " +
        output
    );
}

// ======================================================
// PARSE SORT OUTPUT
// ======================================================

function parseSortOutput(
    output,
    algorithm,
    defaultComplexity
) {
    const lines = String(output)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const sortedLine =
        lines.find(
            (line) =>
                line.startsWith(
                    "SORTED|"
                )
        );

    if (!sortedLine) {
        throw new Error(
            "SORTED output missing from C++."
        );
    }

    const sortedParts =
        sortedLine.split("|");

    const comparisons =
        Number(
            sortedParts[1]
        ) || 0;

    const complexityLine =
        lines.find(
            (line) =>
                line.startsWith(
                    "COMPLEXITY|"
                )
        );

    const students =
        lines
            .filter(
                (line) =>
                    !line.startsWith(
                        "SORTED|"
                    ) &&
                    !line.startsWith(
                        "COMPLEXITY|"
                    )
            )
            .map(parseStudentLine)
            .filter(Boolean);

    return {
        success: true,
        algorithm,
        students,
        comparisons,
        timeComplexity:
            complexityLine
                ? complexityLine.split("|")[1]
                : defaultComplexity,
        spaceComplexity: "O(n)",
    };
}

// ======================================================
// SAVE UNDO RECORD IN MONGO
//
// This is history/metadata only.
// Actual DSA undo is performed by student_list.cpp.
// ======================================================

async function saveUndoRecord(
    teacherId,
    operation,
    beforeStudent,
    afterStudent = null
) {
    await undoCollection.insertOne({
        teacherId,
        operation,
        beforeStudent,
        afterStudent,
        createdAt: new Date(),
    });

    // New operation invalidates redo history.
    await redoCollection.deleteMany({
        teacherId,
    });
}

// ======================================================
// SAVE REDO RECORD
// ======================================================

async function saveRedoRecord(
    record
) {
    await redoCollection.insertOne({
        ...record,
        createdAt: new Date(),
    });
}



// ======================================================
// HEALTH
// ======================================================

app.get(
    "/api/health",
    async (req, res) => {
        try {
            res.json({
                success: true,
                message:
                    "DataNest API is running",
                mongodb: Boolean(db),
                cppEngine:
                    cppEngine || "not found",
                studentsFile,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
);

// ======================================================
// GET STUDENTS
//
// MongoDB is the source for frontend display.
// ======================================================

app.get(
    "/api/students", authenticateToken,
    async (req, res) => {
        try {
            const filter =
                req.user.role === "student"
                    ? {
                        rollNo:
                            Number(req.user.studentRollNo),
                        teacherId: req.user.teacherId,
                    }
                    : {
                        teacherId:
                            req.user.userId,
                    };

            const students = await studentsCollection
                .find(filter)
                .sort({ rollNo: 1 })
                .toArray();

            res.json({
                success: true,
                count:
                    students.length,
                students,
            });
        } catch (error) {
            console.error(
                "GET STUDENTS ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to retrieve students.",
            });
        }
    }
);

// ===============================
// PROFILE
// ===============================
app.get("/api/profile", authenticateToken, async (req, res) => {
    try {
        // ===========================
        // TEACHER PROFILE
        // ===========================
        if (req.user.role === "teacher") {
            const teacher = await usersCollection.findOne(
                {
                    _id: new ObjectId(req.user.userId),
                },
                {
                    projection: {
                        password: 0,
                    },
                }
            );

            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: "Teacher profile not found.",
                });
            }

            const studentCount =
                await studentsCollection.countDocuments({
                    teacherId: req.user.userId,
                });

            return res.json({
                success: true,
                profile: {
                    name: teacher.name,
                    email: teacher.email,
                    role: teacher.role,
                    teacherId: teacher._id,
                    studentCount,
                    createdAt: teacher.createdAt,
                },
            });
        }

        // ===========================
        // STUDENT PROFILE
        // ===========================
        const student = await studentsCollection.findOne({
            rollNo: Number(req.user.studentRollNo),
            teacherId: req.user.teacherId,
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student profile not found.",
            });
        }

        const teacher = await usersCollection.findOne(
            {
                _id: new ObjectId(student.teacherId),
                role: "teacher",
            },
            {
                projection: {
                    password: 0,
                },
            }
        );

        return res.json({
            success: true,
            profile: {
                name: student.name,
                email: student.email,
                rollNo: student.rollNo,
                department: student.department,
                year: student.year,
                cgpa: student.cgpa,
                attendance: student.attendance ?? 0,

                // Teacher information
                teacherName: teacher?.name || "Not assigned",
                teacherEmail: teacher?.email || "",
            },
        });
    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to load profile.",
        });
    }
});

// ======================================================
// STUDENT SEND SERVICE REQUEST
// Request automatically goes to student's assigned teacher
// ======================================================

// ======================================================
// STUDENT -> SEND SERVICE REQUEST
// ======================================================
app.post(
    "/api/requests",
    authenticateToken,
    async (req, res) => {
        try {
            if (req.user.role !== "student") {
                return res.status(403).json({
                    success: false,
                    message: "Only students can send requests.",
                });
            }

            const { requestType, message } = req.body;

            if (!requestType || !message || !message.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Request type and message are required.",
                });
            }

            // Find the logged-in student's real MongoDB record
            const student = await studentsCollection.findOne({
                rollNo: Number(req.user.studentRollNo),
                teacherId: req.user.teacherId,
            });

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student record not found.",
                });
            }

            // Get the teacher assigned to this student
            const teacher = await usersCollection.findOne({
                _id: new ObjectId(student.teacherId),
                role: "teacher",
            });

            if (!teacher) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned teacher not found.",
                });
            }

            const request = {
                studentRollNo: Number(student.rollNo),
                studentName: student.name,
                studentEmail: student.email,

                teacherId: student.teacherId,
                teacherName: teacher.name,
                teacherEmail: teacher.email,

                requestType: requestType.trim(),
                message: message.trim(),

                status: "Pending",
                createdAt: new Date(),
            };

            const result = await requestsCollection.insertOne(request);

            res.status(201).json({
                success: true,
                message: "Request sent to your teacher successfully.",
                request: {
                    _id: result.insertedId,
                    ...request,
                },
            });

        } catch (error) {
            console.error("CREATE REQUEST ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Failed to send request.",
            });
        }
    }
);

// ======================================================
// GET MY REQUESTS
// Student can see only their own requests
// ======================================================

app.get(
    "/api/my-requests",
    authenticateToken,
    async (req, res) => {
        try {
            if (req.user.role !== "student") {
                return res.status(403).json({
                    success: false,
                    message:
                        "Student access required.",
                });
            }

            const requests =
                await requestsCollection
                    .find({
                        studentRollNo:
                            Number(
                                req.user.studentRollNo
                            ),

                        teacherId:
                            req.user.teacherId,
                    })
                    .sort({
                        createdAt: -1,
                    })
                    .toArray();

            return res.json({
                success: true,
                requests,
            });

        } catch (error) {
            console.error(
                "GET MY REQUESTS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to load your requests.",
            });
        }
    }
);

// ======================================================
// GET TEACHER REQUESTS
// Teacher can see only requests sent to that teacher
// ======================================================

// ======================================================
// TEACHER -> GET ONLY THEIR STUDENTS' REQUESTS
// ======================================================
app.get(
    "/api/requests",
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        try {
            const requests = await requestsCollection
                .find({
                    teacherId: req.user.userId,
                })
                .sort({
                    createdAt: -1,
                })
                .toArray();

            res.json({
                success: true,
                count: requests.length,
                requests,
            });

        } catch (error) {
            console.error("GET REQUESTS ERROR:", error);

            res.status(500).json({
                success: false,
                message: "Failed to load requests.",
            });
        }
    }
);

// ======================================================
// TEACHER -> UPDATE REQUEST STATUS
// Teacher can update only their own student's request
// ======================================================

app.put(
    "/api/requests/:id/status",
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request ID.",
                });
            }

            if (
                !["Pending", "Approved", "Rejected"].includes(
                    status
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request status.",
                });
            }

            const result =
                await requestsCollection.updateOne(
                    {
                        _id: new ObjectId(id),

                        // IMPORTANT:
                        // Only the assigned teacher can update it
                        teacherId: req.user.userId,
                    },
                    {
                        $set: {
                            status,
                            updatedAt: new Date(),
                        },
                    }
                );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Request not found or you are not authorized to update it.",
                });
            }

            return res.json({
                success: true,
                message:
                    `Request ${status.toLowerCase()} successfully.`,
            });

        } catch (error) {
            console.error(
                "UPDATE REQUEST STATUS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update request status.",
            });
        }
    }
);

// ======================================================
// ADD STUDENT
//
// 1. Mongo data -> students.txt
// 2. C++ add
// 3. C++ saves students.txt
// 4. students.txt -> MongoDB
// ======================================================

app.post(
    "/api/students", authenticateToken,
    requireTeacher,
    async (req, res) => {
        const {
            rollNo,
            name,
            email,
            department,
            year,
            cgpa,
            attendance,
        } = req.body;

        if (
            rollNo === undefined ||
            rollNo === null ||
            String(rollNo).trim() === "" ||
            !name ||
            !email ||
            !department ||
            !year ||
            cgpa === undefined ||
            cgpa === null ||
            String(cgpa).trim() === ""
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "All student fields are required.",
            });
        }

        const numericRollNo =
            Number(rollNo);

        const numericCgpa =
            Number(cgpa);
        const numericAttendance = Number(attendance);

        if (
            Number.isNaN(
                numericRollNo
            ) ||
            Number.isNaN(
                numericCgpa
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Roll number and CGPA must be numeric.",
            });
        }

        if (
            Number.isNaN(numericAttendance) ||
            numericAttendance < 0 ||
            numericAttendance > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Attendance must be between 0 and 100.",
            });
        }

        try {
            const existing =
                await studentsCollection.findOne({
                    rollNo: numericRollNo,
                    teacherId: req.user.userId,
                });

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message:
                        "A student with this roll number already exists.",
                });
            }

            // Sync real MongoDB state into C++ file.
            await syncMongoToCppFile(getDataOwnerId(req));

            const cpp =
                await runCpp([
                    "add",
                    numericRollNo,
                    name,
                    email,
                    department,
                    year,
                    numericCgpa,
                    numericAttendance,
                ]);

            if (
                cpp.output ===
                "DUPLICATE_ROLL_NO"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "C++ reports duplicate roll number.",
                });
            }

            if (
                cpp.output ===
                "SAVE_FAILED"
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "C++ could not save students.txt.",
                });
            }

            if (!cpp.output.includes("STUDENT_ADDED")) {
                throw new Error(
                    "Unexpected C++ ADD response: " +
                    cpp.output
                );
            }

            // C++ -> students.txt -> MongoDB
            const syncedStudents =
                await syncCppFileToMongo(req.user.userId);

            // Find the student that was actually added
            const addedStudent =
                syncedStudents.find(
                    (student) =>
                        student.rollNo === numericRollNo
                );

            if (addedStudent) {
                addedStudent.teacherId = req.user.userId;
            }

            // Save history in Mongo
            await saveUndoRecord(
                req.user.userId,
                "ADD",
                null,
                addedStudent
            );

            return res.status(201).json({
                success: true,
                message: "Student added successfully.",
                student: addedStudent || null,
            });

        } catch (error) {
            console.error(
                "ADD STUDENT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to add student.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// UPDATE STUDENT
// ======================================================

app.put(
    "/api/students/:rollNo",
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        const rollNo = Number(req.params.rollNo);

        const {
            name,
            email,
            department,
            year,
            cgpa,
            attendance,
        } = req.body;

        if (Number.isNaN(rollNo)) {
            return res.status(400).json({
                success: false,
                message: "Invalid roll number.",
            });
        }

        if (
            !name ||
            !email ||
            !department ||
            !year ||
            cgpa === undefined ||
            attendance === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All student fields are required.",
            });
        }

        const numericCgpa = Number(cgpa);
        const numericAttendance = Number(attendance);

        if (
            Number.isNaN(numericCgpa) ||
            numericCgpa < 0 ||
            numericCgpa > 10
        ) {
            return res.status(400).json({
                success: false,
                message: "CGPA must be between 0 and 10.",
            });
        }

        if (
            Number.isNaN(numericAttendance) ||
            numericAttendance < 0 ||
            numericAttendance > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance must be between 0 and 100.",
            });
        }

        try {
            // -----------------------------------------
            // 1. Get old MongoDB record
            // -----------------------------------------
            const before =
                await studentsCollection.findOne({
                    rollNo,
                    teacherId: req.user.userId,
                });

            if (!before) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found.",
                });
            }

            // -----------------------------------------
            // 2. Sync MongoDB student data to C++
            // -----------------------------------------
            await syncMongoToCppFile(
                getDataOwnerId(req)
            );

            // -----------------------------------------
            // 3. Update academic information through C++
            //    Attendance is NOT sent to C++
            // -----------------------------------------
            const cpp = await runCpp([
                "update",
                rollNo,
                name,
                email,
                department,
                year,
                numericCgpa,
                numericAttendance,
            ]);
            if (cpp.output === "NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message:
                        "C++ could not find student.",
                });
            }

            if (cpp.output === "SAVE_FAILED") {
                return res.status(500).json({
                    success: false,
                    message:
                        "C++ could not save students.txt.",
                });
            }

            if (!cpp.output.includes("STUDENT_UPDATED")) {
                throw new Error(
                    "Unexpected C++ UPDATE response: " +
                    cpp.output
                );
            }

            // -----------------------------------------
            // 4. Sync C++ academic data back to MongoDB
            // -----------------------------------------
            await syncCppFileToMongo(
                req.user.userId
            );



            // -----------------------------------------
            // 6. Get FINAL updated MongoDB record
            // -----------------------------------------
            const after =
                await studentsCollection.findOne({
                    rollNo,
                    teacherId: req.user.userId,
                });

            // -----------------------------------------
            // 7. Save undo record
            // -----------------------------------------
            await saveUndoRecord(
                req.user.userId,
                "UPDATE",
                before,
                after
            );

            // -----------------------------------------
            // 8. Send final record to frontend
            // -----------------------------------------
            res.json({
                success: true,
                message:
                    "Student updated successfully.",
                student: after,
            });

        } catch (error) {
            console.error(
                "UPDATE STUDENT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update student.",
                error: error.message,
            });
        }
    }
);


// ======================================================
// UPDATE STUDENT ATTENDANCE
// MongoDB owns attendance.
// C++ is NOT involved.
// ======================================================

app.put(
    "/api/students/:rollNo/attendance",
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        const rollNo = Number(req.params.rollNo);
        const attendance = Number(req.body.attendance);

        if (Number.isNaN(rollNo)) {
            return res.status(400).json({
                success: false,
                message: "Invalid roll number.",
            });
        }

        if (
            Number.isNaN(attendance) ||
            attendance < 0 ||
            attendance > 100
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Attendance must be between 0 and 100.",
            });
        }

        try {
            const student =
                await studentsCollection.findOne({
                    rollNo,
                    teacherId: req.user.userId,
                });

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found.",
                });
            }

            await syncMongoToCppFile(
                req.user.userId
            );

            const cpp = await runCpp([
                "update",
                rollNo,
                student.name,
                student.email,
                student.department,
                student.year,
                student.cgpa,
                attendance,
            ]);

            if (cpp.output === "NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "C++ could not find student.",
                });
            }

            if (cpp.output === "SAVE_FAILED") {
                return res.status(500).json({
                    success: false,
                    message: "C++ could not save students.txt.",
                });
            }

            if (!cpp.output.includes("STUDENT_UPDATED")) {
                throw new Error(
                    "Unexpected C++ UPDATE response: " +
                    cpp.output
                );
            }

            await syncCppFileToMongo(
                req.user.userId
            );

            const updatedStudent =
                await studentsCollection.findOne({
                    rollNo,
                    teacherId: req.user.userId,
                });

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found.",
                });
            }


            res.json({
                success: true,
                message:
                    "Attendance updated successfully.",
                student: updatedStudent,
            });
        } catch (error) {
            console.error(
                "UPDATE ATTENDANCE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to update attendance.",
                error: error.message,
            });
        }
    }
);

// ======================================================
// DELETE STUDENT
// ======================================================

app.delete(
    "/api/students/:rollNo", authenticateToken,
    requireTeacher,
    async (req, res) => {
        const rollNo =
            Number(
                req.params.rollNo
            );

        if (
            Number.isNaN(rollNo)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid roll number.",
            });
        }

        try {
            const before =
                await studentsCollection.findOne(
                    {
                        rollNo,
                        teacherId: req.user.userId,
                    }
                );

            if (!before) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student not found.",
                });
            }

            await syncMongoToCppFile(getDataOwnerId(req));

            const cpp =
                await runCpp([
                    "delete",
                    rollNo,
                ]);

            if (
                cpp.output ===
                "NOT_FOUND"
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "C++ could not find student.",
                });
            }

            if (
                cpp.output ===
                "SAVE_FAILED"
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "C++ could not save students.txt.",
                });
            }

            if (
                !cpp.output.includes(
                    "STUDENT_DELETED"
                )
            ) {
                throw new Error(
                    "Unexpected C++ DELETE response: " +
                    cpp.output
                );
            }

            await syncCppFileToMongo(
                req.user.userId
            );

            await saveUndoRecord(
                req.user.userId,
                "DELETE",
                before,
                null
            );

            res.json({
                success: true,
                message:
                    "Student deleted successfully.",
                student:
                    before,
            });
        } catch (error) {
            console.error(
                "DELETE STUDENT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to delete student.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// LINEAR SEARCH
// ======================================================

app.get(
    "/api/search/linear/:rollNo",
    authenticateToken,
    async (req, res) => {
        const rollNo =
            Number(
                req.params.rollNo
            );

        if (
            Number.isNaN(rollNo)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid roll number.",
            });
        }

        if (
            req.user.role === "student" &&
            rollNo !== Number(req.user.studentRollNo)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Students can only search their own record.",
            });
        }

        try {
            await syncMongoToCppFile(
                getDataOwnerId(req)
            );

            const cpp =
                await runCpp([
                    "linear-search",
                    rollNo,
                ]);

            const result =
                parseSearchOutput(
                    cpp.output,
                    "Linear Search"
                );

            result.timeComplexity =
                "O(n)";

            result.spaceComplexity =
                "O(1)";

            res.json(result);
        } catch (error) {
            console.error(
                "LINEAR SEARCH ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Linear Search failed.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// BINARY SEARCH
// ======================================================

app.get(
    "/api/search/binary/:rollNo",
    authenticateToken,
    async (req, res) => {
        const rollNo =
            Number(
                req.params.rollNo
            );

        if (
            Number.isNaN(rollNo)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid roll number.",
            });
        }

        if (
            req.user.role === "student" &&
            rollNo !== Number(req.user.studentRollNo)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Students can only search their own record.",
            });
        }

        try {
            await syncMongoToCppFile(
                getDataOwnerId(req)
            );

            const cpp =
                await runCpp([
                    "binary-search",
                    rollNo,
                ]);

            const result =
                parseSearchOutput(
                    cpp.output,
                    "Binary Search"
                );

            result.timeComplexity =
                "O(log n)";

            result.spaceComplexity =
                "O(1)";

            res.json(result);
        } catch (error) {
            console.error(
                "BINARY SEARCH ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Binary Search failed.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// COMPARE SEARCHING
// ======================================================

app.get(
    "/api/search/compare/:rollNo",
    authenticateToken,
    async (req, res) => {
        const rollNo =
            Number(
                req.params.rollNo
            );

        if (
            Number.isNaN(rollNo)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid roll number.",
            });
        }

        if (
            req.user.role === "student" &&
            rollNo !== Number(req.user.studentRollNo)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Students can only search their own record.",
            });
        }

        try {
            await syncMongoToCppFile(
                getDataOwnerId(req)
            );

            const [
                linearCpp,
                binaryCpp,
            ] = await Promise.all([
                runCpp([
                    "linear-search",
                    rollNo,
                ]),
                runCpp([
                    "binary-search",
                    rollNo,
                ]),
            ]);

            const linear =
                parseSearchOutput(
                    linearCpp.output,
                    "Linear Search"
                );

            const binary =
                parseSearchOutput(
                    binaryCpp.output,
                    "Binary Search"
                );

            linear.timeComplexity =
                "O(n)";

            linear.spaceComplexity =
                "O(1)";

            binary.timeComplexity =
                "O(log n)";

            binary.spaceComplexity =
                "O(1)";

            res.json({
                success: true,
                rollNo,
                linearSearch:
                    linear,
                binarySearch:
                    binary,
                comparisonDifference:
                    Math.abs(
                        linear.comparisons -
                        binary.comparisons
                    ),
            });
        } catch (error) {
            console.error(
                "SEARCH COMPARE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to compare search algorithms.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// INSERTION SORT
// ======================================================

app.get(
    "/api/sort/insertion",
    authenticateToken,
    requireTeacher,
    async (req, res) => {
        try {
            await syncMongoToCppFile(getDataOwnerId(req));

            const cpp =
                await runCpp([
                    "insertion-sort",
                ]);

            const result =
                parseSortOutput(
                    cpp.output,
                    "Insertion Sort",
                    "O(n^2)"
                );

            res.json(result);
        } catch (error) {
            console.error(
                "INSERTION SORT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Insertion Sort failed.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// MERGE SORT
// ======================================================

app.get(
    "/api/sort/merge", authenticateToken,
    requireTeacher,
    async (req, res) => {
        try {
            await syncMongoToCppFile(getDataOwnerId(req));

            const cpp =
                await runCpp([
                    "merge-sort",
                ]);

            const result =
                parseSortOutput(
                    cpp.output,
                    "Merge Sort",
                    "O(n log n)"
                );

            res.json(result);
        } catch (error) {
            console.error(
                "MERGE SORT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Merge Sort failed.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// COMPARE SORTING
// ======================================================

app.get(
    "/api/sort/compare", authenticateToken, requireTeacher,
    async (req, res) => {
        try {
            await syncMongoToCppFile(getDataOwnerId(req));

            const [
                insertionCpp,
                mergeCpp,
            ] = await Promise.all([
                runCpp([
                    "insertion-sort",
                ]),
                runCpp([
                    "merge-sort",
                ]),
            ]);

            const insertion =
                parseSortOutput(
                    insertionCpp.output,
                    "Insertion Sort",
                    "O(n^2)"
                );

            const merge =
                parseSortOutput(
                    mergeCpp.output,
                    "Merge Sort",
                    "O(n log n)"
                );

            res.json({
                success: true,

                insertionSort:
                    insertion,

                mergeSort:
                    merge,

                comparisonDifference:
                    Math.abs(
                        insertion.comparisons -
                        merge.comparisons
                    ),
            });
        } catch (error) {
            console.error(
                "SORT COMPARE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to compare sorting algorithms.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// STACK / C++ UNDO
//
// IMPORTANT:
// Actual Stack/Undo logic is performed inside
// student_list.cpp.
// MongoDB only stores the resulting state/history.
// ======================================================

app.get(
    "/api/stack/test", authenticateToken, requireTeacher,
    async (req, res) => {
        try {

            // Get the latest undo record BEFORE C++ changes the data
            const latestUndo =
                await undoCollection.findOne(
                    {
                        teacherId:
                            req.user.userId,
                    },
                    {
                        sort: {
                            createdAt: -1,
                        },
                    }
                );
            await syncMongoToCppFile(getDataOwnerId(req));

            const beforeCount =
                await studentsCollection.countDocuments({
                    teacherId: req.user.userId,
                });

            const cpp =
                await runCpp([
                    "undo",
                ]);

            if (
                cpp.output ===
                "NOTHING_TO_UNDO"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "There is nothing to undo.",
                });
            }

            if (
                cpp.output ===
                "SAVE_FAILED"
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "C++ failed to save after undo.",
                });
            }

            const afterStudents =
                await syncCppFileToMongo(req.user.userId);


            const lines =
                cpp.output.split("|");

            res.json({
                success: true,
                operation:
                    lines[1] || "",
                rollNo:
                    Number(lines[2]) || 0,
                studentName:
                    lines[3] || "",
                stackSizeBeforeUndo:
                    beforeCount,
                stackSizeAfterUndo:
                    afterStudents.length,
                dataStructure:
                    "Stack",
                principle:
                    "LIFO",
                cppOutput:
                    cpp.output,
            });
        } catch (error) {
            console.error(
                "STACK/UNDO ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Stack/Undo operation failed.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// REAL UNDO
// ======================================================

app.post(
    "/api/undo",
    authenticateToken, requireTeacher,
    async (req, res) => {
        try {

            // Get the latest undo record BEFORE C++ changes the data
            const latestUndo =
                await undoCollection.findOne(
                    {
                        teacherId:
                            req.user.userId,
                    },
                    {
                        sort: {
                            createdAt: -1,
                        },
                    }
                );

            await syncMongoToCppFile(
                getDataOwnerId(req)
            );

            const cpp =
                await runCpp([
                    "undo",
                ]);

            if (
                cpp.output ===
                "NOTHING_TO_UNDO"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "There is nothing to undo.",
                });
            }

            if (
                cpp.output ===
                "SAVE_FAILED"
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "C++ could not save after undo.",
                });
            }

            if (
                !cpp.output.startsWith(
                    "UNDO_SUCCESS|"
                )
            ) {
                throw new Error(
                    "Unexpected C++ UNDO response: " +
                    cpp.output
                );
            }

            const parts =
                cpp.output.split("|");

            const operation =
                parts[1] || "";

            const rollNo =
                Number(parts[2]) || 0;

            const studentName =
                parts[3] || "";

            await syncCppFileToMongo(
                req.user.userId
            );





            if (latestUndo) {
                await saveRedoRecord({
                    teacherId:
                        req.user.userId,
                    operation:
                        latestUndo.operation,
                    beforeStudent:
                        latestUndo.beforeStudent,
                    afterStudent:
                        latestUndo.afterStudent,
                });

                await undoCollection.deleteOne({
                    _id:
                        latestUndo._id,
                });
            }

            res.json({
                success: true,
                operation,
                rollNo,
                studentName,
                message:
                    "Last operation was undone using the C++ Stack/Undo implementation.",
            });
        } catch (error) {
            console.error(
                "UNDO ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to undo last operation.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// REAL REDO
// ======================================================

app.post(
    "/api/redo", authenticateToken, requireTeacher,
    async (req, res) => {
        try {

            // Get the latest redo record BEFORE C++ changes the data
            const latestRedo =
                await redoCollection.findOne(
                    {
                        teacherId:
                            req.user.userId,
                    },
                    {
                        sort: {
                            createdAt: -1,
                        },
                    }
                );

            await syncMongoToCppFile(
                getDataOwnerId(req)
            );

            const cpp =
                await runCpp([
                    "redo",
                ]);

            if (
                cpp.output ===
                "NOTHING_TO_REDO"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "There is nothing to redo.",
                });
            }

            if (
                cpp.output ===
                "SAVE_FAILED"
            ) {
                return res.status(500).json({
                    success: false,
                    message:
                        "C++ could not save after redo.",
                });
            }

            if (
                !cpp.output.startsWith(
                    "REDO_SUCCESS|"
                )
            ) {
                throw new Error(
                    "Unexpected C++ REDO response: " +
                    cpp.output
                );
            }

            const parts =
                cpp.output.split("|");

            const operation =
                parts[1] || "";

            const rollNo =
                Number(parts[2]) || 0;

            const studentName =
                parts[3] || "";

            await syncCppFileToMongo(
                req.user.userId
            );

            // Restore MongoDB-owned attendance when Redo
            // recreates a student that C++ does not store completely.
            if (
                latestRedo &&
                latestRedo.operation === "ADD" &&
                latestRedo.afterStudent
            ) {
                await restoreMongoOwnedFields(
                    req.user.userId,
                    latestRedo.afterStudent
                );
            }

            if (latestRedo) {
                await undoCollection.insertOne({
                    teacherId:
                        req.user.userId,
                    operation:
                        latestRedo.operation,
                    beforeStudent:
                        latestRedo.beforeStudent,
                    afterStudent:
                        latestRedo.afterStudent,
                    createdAt:
                        new Date(),
                });

                await redoCollection.deleteOne({
                    _id:
                        latestRedo._id,
                });
            }

            res.json({
                success: true,
                operation,
                rollNo,
                studentName,
                message:
                    "Last operation was redone using the C++ Stack/Redo implementation.",
            });
        } catch (error) {
            console.error(
                "REDO ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Failed to redo last operation.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// QUEUE TEST
//
// Your C++ queue-test loads actual students from
// students.txt, then performs FIFO operations.
// ======================================================

// ======================================================
// QUEUE TEST
// C++ Queue + MongoDB persistent dequeue
// ======================================================

app.get(
    "/api/queue/test",
    authenticateToken,
    async (req, res) => {
        try {
            const teacherId = getDataOwnerId(req);

            // 1. MongoDB students -> students.txt
            await syncMongoToCppFile(teacherId);

            // 2. Run original C++ queue implementation
            const cpp = await runCpp([
                "queue-test",
            ]);

            const lines = String(cpp.output)
                .split(/\r?\n/)
                .filter(Boolean);

            // 3. Read C++ queue result
            const sizes = lines
                .filter((line) =>
                    line.startsWith("QUEUE_SIZE|")
                )
                .map((line) =>
                    Number(line.split("|")[1]) || 0
                );

            const front = lines.find((line) =>
                line.startsWith("FRONT|")
            );

            const dequeue = lines.find((line) =>
                line.startsWith("DEQUEUE|")
            );

            const frontParts = front
                ? front.split("|")
                : [];

            const dequeueParts = dequeue
                ? dequeue.split("|")
                : [];

            const dequeuedRollNo =
                Number(dequeueParts[1]) || 0;

            const dequeuedStudent =
                dequeueParts[2] || "";

            // 4. IMPORTANT:
            // C++ queue-test has already removed the front student
            // from students.txt.
            // Now persist that exact result back to MongoDB.
            const syncedStudents =
                await syncCppFileToMongo(teacherId);

            // 5. Return same visualization data to frontend
            res.json({
                success: true,

                dataStructure: "Queue",

                principle: "FIFO",

                initialSize:
                    sizes[0] || 0,

                finalSize:
                    syncedStudents.length,

                frontRollNo:
                    Number(frontParts[1]) || 0,

                frontStudent:
                    frontParts[2] || "",

                dequeuedRollNo,

                dequeuedStudent,

                persisted: true,
                remainingStudents:
                    syncedStudents,

                source:
                    "MongoDB -> students.txt -> student_list.cpp -> MongoDB",
            });

        } catch (error) {
            console.error(
                "QUEUE TEST ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Queue operation failed.",
                error: error.message,
            });
        }
    }
);


// ======================================================
// SINGLY LINKED LIST
//
// C++ loads actual students.txt data.
// ======================================================

app.get(
    "/api/linked-list/test", authenticateToken,
    async (req, res) => {
        try {
            await syncMongoToCppFile(getDataOwnerId(req));

            const cpp =
                await runCpp([
                    "linked-list-test",
                ]);

            const lines =
                String(cpp.output)
                    .split(/\r?\n/)
                    .filter(Boolean);

            const nodes =
                lines
                    .filter(
                        (line) =>
                            line.startsWith(
                                "NODE|"
                            )
                    )
                    .map((line) => {
                        const parts =
                            line.split("|");

                        return {
                            rollNo:
                                Number(
                                    parts[1]
                                ) || 0,
                            name:
                                parts[2] || "",
                        };
                    });

            const headLine =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "HEAD|"
                        )
                );

            const tailLine =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "TAIL|"
                        )
                );

            const sizeLine =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "SIZE|"
                        )
                );

            const headParts =
                headLine
                    ? headLine.split("|")
                    : [];

            const tailParts =
                tailLine
                    ? tailLine.split("|")
                    : [];

            res.json({
                success: true,

                dataStructure:
                    "Singly Linked List",

                nodes,

                head: {
                    rollNo:
                        Number(
                            headParts[1]
                        ) || 0,
                    name:
                        headParts[2] || "",
                },

                tail: {
                    rollNo:
                        Number(
                            tailParts[1]
                        ) || 0,
                    name:
                        tailParts[2] || "",
                },

                size:
                    sizeLine
                        ? Number(
                            sizeLine.split("|")[1]
                        )
                        : 0,

                source:
                    "MongoDB -> students.txt -> student_list.cpp",
            });
        } catch (error) {
            console.error(
                "SINGLY LINKED LIST ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Singly Linked List operation failed.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// DOUBLY LINKED LIST
//
// IMPORTANT:
// Existing untouched student_list.cpp command uses
// hard-coded demo students 301,302,303.
// Server cannot change that behavior without modifying
// the C++ file.
// ======================================================

app.get(
    "/api/doubly-linked-list/test", authenticateToken,
    async (req, res) => {
        try {
            // We still synchronize the real Mongo data
            // into students.txt, but the existing C++
            // doubly-linked-list-test command itself
            // creates its own demo nodes.

            await syncMongoToCppFile(getDataOwnerId(req));

            const cpp =
                await runCpp([
                    "doubly-linked-list-test",
                ]);

            const lines =
                String(cpp.output)
                    .split(/\r?\n/)
                    .filter(Boolean);

            const sizeLine =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "SIZE|"
                        )
                );

            const headLine =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "HEAD|"
                        )
                );

            const tailLine =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "TAIL|"
                        )
                );

            const forwardIndex =
                lines.indexOf(
                    "FORWARD"
                );

            const backwardIndex =
                lines.indexOf(
                    "BACKWARD"
                );

            const forwardNodes =
                forwardIndex !== -1 &&
                    backwardIndex !== -1
                    ? lines
                        .slice(
                            forwardIndex + 1,
                            backwardIndex
                        )
                        .filter(
                            (line) =>
                                line.startsWith(
                                    "NODE|"
                                )
                        )
                    : [];

            const backwardNodes =
                backwardIndex !== -1
                    ? lines
                        .slice(
                            backwardIndex + 1
                        )
                        .filter(
                            (line) =>
                                line.startsWith(
                                    "NODE|"
                                )
                        )
                    : [];

            const parseNode =
                (line) => {
                    const parts =
                        line.split("|");

                    return {
                        rollNo:
                            Number(
                                parts[1]
                            ) || 0,
                        name:
                            parts[2] || "",
                    };
                };

            const headParts =
                headLine
                    ? headLine.split("|")
                    : [];

            const tailParts =
                tailLine
                    ? tailLine.split("|")
                    : [];

            res.json({
                success: true,

                dataStructure:
                    "Doubly Linked List",

                size:
                    sizeLine
                        ? Number(
                            sizeLine.split("|")[1]
                        )
                        : 0,

                head: {
                    rollNo:
                        Number(
                            headParts[1]
                        ) || 0,
                    name:
                        headParts[2] || "",
                },

                tail: {
                    rollNo:
                        Number(
                            tailParts[1]
                        ) || 0,
                    name:
                        tailParts[2] || "",
                },

                forward:
                    forwardNodes.map(
                        parseNode
                    ),

                backward:
                    backwardNodes.map(
                        parseNode
                    ),

                source:
                    "student_list.cpp existing doubly-linked-list-test demo",

                warning:
                    "This existing C++ command uses demo students 301, 302 and 303. Real MongoDB students cannot be used here without changing student_list.cpp.",
            });
        } catch (error) {
            console.error(
                "DOUBLY LINKED LIST ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Doubly Linked List operation failed.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// OPTIONAL: SYNC STATUS
// ======================================================

app.get(
    "/api/dsa/sync-status",
    async (req, res) => {
        try {
            const students =
                await studentsCollection
                    .find({})
                    .sort({
                        rollNo: 1,
                    })
                    .toArray();

            let fileExists = true;
            let fileStudents = [];

            try {
                const content =
                    await fs.readFile(
                        studentsFile,
                        "utf8"
                    );

                fileStudents =
                    content
                        .split(/\r?\n/)
                        .filter(Boolean)
                        .map(
                            parseStudentLine
                        )
                        .filter(Boolean);
            } catch (error) {
                if (
                    error.code ===
                    "ENOENT"
                ) {
                    fileExists = false;
                } else {
                    throw error;
                }
            }

            res.json({
                success: true,
                mongodbCount:
                    students.length,
                studentsFileExists:
                    fileExists,
                studentsFileCount:
                    fileStudents.length,
                cppEngine,
                studentsFile,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message:
                    "Unable to check DSA sync status.",
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// START SERVER
// ======================================================

async function startServer() {
    try {
        await ensureDsaDirectory();

        await connectMongoDB();

        await findCppEngine();

        // IMPORTANT:
        // On startup, MongoDB is the source of truth.
        // Do NOT allow old students.txt data to overwrite
        // MongoDB.
        // await syncMongoToCppFile();
        // MongoDB -> students.txt synchronization happens
        // when an authenticated teacher/student performs a DSA operation.

        app.listen(
            PORT,
            () => {
                console.log(
                    `DataNest API running at http://localhost:${PORT}`
                );

                console.log(
                    "MongoDB -> students.txt -> C++ DSA synchronization enabled."
                );
            }
        );
    } catch (error) {
        console.error(
            "SERVER STARTUP FAILED:",
            error
        );

        process.exit(1);
    }
}

startServer();

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

async function shutdown() {
    try {
        await mongoClient.close();

        console.log(
            "MongoDB connection closed."
        );
    } finally {
        process.exit(0);
    }
}

process.on(
    "SIGINT",
    shutdown
);

process.on(
    "SIGTERM",
    shutdown
);