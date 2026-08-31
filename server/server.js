require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs/promises");

const app = express();

const PORT = Number(process.env.PORT) || 5000;

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
let undoCollection;
let redoCollection;

// ======================================================
// EXPRESS
// ======================================================

app.use(cors());
app.use(express.json());

// ======================================================
// DATABASE CONNECTION
// ======================================================

async function connectMongoDB() {
    await mongoClient.connect();

    db = mongoClient.db("datanest");

    studentsCollection = db.collection("students");
    undoCollection = db.collection("undo_history");
    redoCollection = db.collection("redo_history");

    await studentsCollection.createIndex(
        { rollNo: 1 },
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
    ].join("|");
}

// ======================================================
// PARSE C++ FILE LINE
// ======================================================

function parseStudentLine(line) {
    const parts = String(line)
        .split("|");

    if (parts.length < 7) {
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
    };
}

// ======================================================
// MONGO -> students.txt
//
// IMPORTANT:
// MongoDB is the permanent datastore.
// students.txt is only the bridge for C++.
// ======================================================

async function syncMongoToCppFile() {
    await ensureDsaDirectory();

    const students = await studentsCollection
        .find({})
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

async function syncCppFileToMongo() {
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

    // Replace MongoDB student collection
    // with the state produced by C++.

    await studentsCollection.deleteMany({});

    if (students.length > 0) {
        await studentsCollection.insertMany(
            students,
            {
                ordered: true,
            }
        );
    }

    return students;
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
            },

            comparisons:
                Number(parts[8]) || 0,

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
    operation,
    beforeStudent,
    afterStudent = null
) {
    await undoCollection.insertOne({
        operation,
        beforeStudent,
        afterStudent,
        createdAt: new Date(),
    });

    // New operation invalidates redo history.
    await redoCollection.deleteMany({});
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
    "/api/students",
    async (req, res) => {
        try {
            const students =
                await studentsCollection
                    .find({})
                    .sort({
                        rollNo: 1,
                    })
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

// ======================================================
// ADD STUDENT
//
// 1. Mongo data -> students.txt
// 2. C++ add
// 3. C++ saves students.txt
// 4. students.txt -> MongoDB
// ======================================================

app.post(
    "/api/students",
    async (req, res) => {
        const {
            rollNo,
            name,
            email,
            department,
            year,
            cgpa,
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

        try {
            const existing =
                await studentsCollection.findOne(
                    {
                        rollNo:
                            numericRollNo,
                    }
                );

            if (existing) {
                return res.status(409).json({
                    success: false,
                    message:
                        "A student with this roll number already exists.",
                });
            }

            // Sync real MongoDB state into C++ file.
            await syncMongoToCppFile();

            const cpp =
                await runCpp([
                    "add",
                    numericRollNo,
                    name,
                    email,
                    department,
                    year,
                    numericCgpa,
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

            if (
                !cpp.output.includes(
                    "STUDENT_ADDED"
                )
            ) {
                throw new Error(
                    "Unexpected C++ ADD response: " +
                    cpp.output
                );
            }

            // C++ is now authoritative for
            // the operation result.
            const syncedStudents =
                await syncCppFileToMongo();

            const addedStudent =
                syncedStudents.find(
                    (student) =>
                        student.rollNo ===
                        numericRollNo
                );

            // Save history in Mongo for UI/history.
            await saveUndoRecord(
                "ADD",
                null,
                addedStudent
            );

            res.status(201).json({
                success: true,
                message:
                    "Student added successfully.",
                student:
                    addedStudent || null,
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
    async (req, res) => {
        const rollNo =
            Number(
                req.params.rollNo
            );

        const {
            name,
            email,
            department,
            year,
            cgpa,
        } = req.body;

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
            !name ||
            !email ||
            !department ||
            !year ||
            cgpa === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "All student fields are required.",
            });
        }

        const numericCgpa =
            Number(cgpa);

        if (
            Number.isNaN(
                numericCgpa
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "CGPA must be numeric.",
            });
        }

        try {
            const before =
                await studentsCollection.findOne(
                    {
                        rollNo,
                    }
                );

            if (!before) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student not found.",
                });
            }

            await syncMongoToCppFile();

            const cpp =
                await runCpp([
                    "update",
                    rollNo,
                    name,
                    email,
                    department,
                    year,
                    numericCgpa,
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
                    "STUDENT_UPDATED"
                )
            ) {
                throw new Error(
                    "Unexpected C++ UPDATE response: " +
                    cpp.output
                );
            }

            const syncedStudents =
                await syncCppFileToMongo();

            const after =
                syncedStudents.find(
                    (student) =>
                        student.rollNo ===
                        rollNo
                );

            await saveUndoRecord(
                "UPDATE",
                before,
                after
            );

            res.json({
                success: true,
                message:
                    "Student updated successfully.",
                student:
                    after || null,
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
                error:
                    error.message,
            });
        }
    }
);

// ======================================================
// DELETE STUDENT
// ======================================================

app.delete(
    "/api/students/:rollNo",
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
                    }
                );

            if (!before) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student not found.",
                });
            }

            await syncMongoToCppFile();

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

            await syncCppFileToMongo();

            await saveUndoRecord(
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
            await syncMongoToCppFile();

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
            await syncMongoToCppFile();

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
            await syncMongoToCppFile();

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
    async (req, res) => {
        try {
            await syncMongoToCppFile();

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
    "/api/sort/merge",
    async (req, res) => {
        try {
            await syncMongoToCppFile();

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
    "/api/sort/compare",
    async (req, res) => {
        try {
            await syncMongoToCppFile();

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
    "/api/stack/test",
    async (req, res) => {
        try {
            await syncMongoToCppFile();

            const beforeCount =
                await studentsCollection.countDocuments();

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
                await syncCppFileToMongo();

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
    async (req, res) => {
        try {
            await syncMongoToCppFile();

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

            await syncCppFileToMongo();

            // Move latest Mongo history record
            // to redo history.
            const latestUndo =
                await undoCollection.findOne(
                    {},
                    {
                        sort: {
                            createdAt: -1,
                        },
                    }
                );

            if (latestUndo) {
                await saveRedoRecord({
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
    "/api/redo",
    async (req, res) => {
        try {
            await syncMongoToCppFile();

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

            await syncCppFileToMongo();

            const latestRedo =
                await redoCollection.findOne(
                    {},
                    {
                        sort: {
                            createdAt: -1,
                        },
                    }
                );

            if (latestRedo) {
                await undoCollection.insertOne({
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

app.get(
    "/api/queue/test",
    async (req, res) => {
        try {
            await syncMongoToCppFile();

            const cpp =
                await runCpp([
                    "queue-test",
                ]);

            const lines =
                String(cpp.output)
                    .split(/\r?\n/)
                    .filter(Boolean);

            const sizes =
                lines
                    .filter(
                        (line) =>
                            line.startsWith(
                                "QUEUE_SIZE|"
                            )
                    )
                    .map(
                        (line) =>
                            Number(
                                line.split("|")[1]
                            ) || 0
                    );

            const front =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "FRONT|"
                        )
                );

            const dequeue =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "DEQUEUE|"
                        )
                );

            const frontParts =
                front
                    ? front.split("|")
                    : [];

            const dequeueParts =
                dequeue
                    ? dequeue.split("|")
                    : [];

            res.json({
                success: true,
                dataStructure:
                    "Queue",
                principle:
                    "FIFO",

                initialSize:
                    sizes[0] || 0,

                finalSize:
                    sizes[1] || 0,

                frontRollNo:
                    Number(
                        frontParts[1]
                    ) || 0,

                frontStudent:
                    frontParts[2] || "",

                dequeuedRollNo:
                    Number(
                        dequeueParts[1]
                    ) || 0,

                dequeuedStudent:
                    dequeueParts[2] || "",

                source:
                    "MongoDB -> students.txt -> student_list.cpp",
            });
        } catch (error) {
            console.error(
                "QUEUE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Queue operation failed.",
                error:
                    error.message,
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
    "/api/linked-list/test",
    async (req, res) => {
        try {
            await syncMongoToCppFile();

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
    "/api/doubly-linked-list/test",
    async (req, res) => {
        try {
            // We still synchronize the real Mongo data
            // into students.txt, but the existing C++
            // doubly-linked-list-test command itself
            // creates its own demo nodes.

            await syncMongoToCppFile();

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
        await syncMongoToCppFile();

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