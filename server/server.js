require("dotenv").config();
const { MongoClient } = require("mongodb");
const express = require("express");
const cors = require("cors");
const { execFile } = require("child_process");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 5000;

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;
let studentsCollection;

async function connectMongoDB() {
    try {
        await mongoClient.connect();

        db = mongoClient.db("datanest");
        studentsCollection = db.collection("students");

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

connectMongoDB();

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// C++ DSA ENGINE PATH
// ==========================================

const cppEngine = path.join(
    __dirname,
    "..",
    "dsa",
    "student_list"
);

const projectRoot = path.join(
    __dirname,
    ".."
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "DataNest API is running",
    });
});

// ==========================================
// RUN C++ DSA ENGINE
// ==========================================

app.get("/api/students", async (req, res) => {
    try {
        const students = await studentsCollection
            .find({})
            .sort({ rollNo: 1 })
            .toArray();

        res.json({
            success: true,
            count: students.length,
            students,
        });
    } catch (error) {
        console.error("MongoDB Fetch Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve students from MongoDB.",
        });
    }
});


app.post("/api/students", async (req, res) => {
    const {
        rollNo,
        name,
        email,
        department,
        year,
        cgpa,
    } = req.body;

    // Validate required fields
    if (
        !rollNo ||
        !name ||
        !email ||
        !department ||
        !year ||
        cgpa === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "All student fields are required.",
        });
    }

    try {
        // Check duplicate roll number
        const existingStudent =
            await studentsCollection.findOne({
                rollNo: Number(rollNo),
            });

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message:
                    "A student with this roll number already exists.",
            });
        }

        // Save student directly to MongoDB
        await studentsCollection.insertOne({
            rollNo: Number(rollNo),
            name,
            email,
            department,
            year,
            cgpa: Number(cgpa),
            status: "Active",
        });

        return res.status(201).json({
            success: true,
            message: "Student added successfully.",
        });

    } catch (error) {
        console.error("MongoDB Insert Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add student to MongoDB.",
        });
    }
});

// ==========================================
// DELETE STUDENT
// ==========================================

app.delete("/api/students/:rollNo", async (req, res) => {
    const rollNo = Number(req.params.rollNo);

    if (Number.isNaN(rollNo)) {
        return res.status(400).json({
            success: false,
            message: "Invalid roll number.",
        });
    }

    try {
        // MongoDB is the primary database
        const result = await studentsCollection.deleteOne({
            rollNo: rollNo,
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found.",
            });
        }

        // Update C++ DSA data as well
        execFile(
            cppEngine,
            ["delete", String(rollNo)],
            {
                cwd: projectRoot,
            },
            (error, stdout, stderr) => {
                if (error) {
                    console.error(
                        "C++ Delete Sync Error:",
                        error
                    );
                }

                if (stderr) {
                    console.error(
                        "C++ Delete stderr:",
                        stderr
                    );
                }
            }
        );

        return res.json({
            success: true,
            message: "Student deleted successfully.",
        });

    } catch (error) {
        console.error("MongoDB Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete student.",
        });
    }
});

// ==========================================
// UPDATE STUDENT
// ==========================================

app.put("/api/students/:rollNo", async (req, res) => {
    const rollNo = Number(req.params.rollNo);

    const {
        name,
        email,
        department,
        year,
        cgpa,
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
        cgpa === undefined
    ) {
        return res.status(400).json({
            success: false,
            message: "All student fields are required.",
        });
    }

    try {
        // MongoDB is the primary database
        const result = await studentsCollection.updateOne(
            { rollNo: rollNo },
            {
                $set: {
                    name,
                    email,
                    department,
                    year,
                    cgpa: Number(cgpa),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found.",
            });
        }

        // Update C++ DSA data as well
        execFile(
            cppEngine,
            [
                "update",
                String(rollNo),
                name,
                email,
                department,
                year,
                String(cgpa),
            ],
            {
                cwd: projectRoot,
            },
            (error, stdout, stderr) => {
                if (error) {
                    console.error(
                        "C++ Update Sync Error:",
                        error
                    );
                }

                if (stderr) {
                    console.error(
                        "C++ Update stderr:",
                        stderr
                    );
                }
            }
        );

        return res.json({
            success: true,
            message: "Student updated successfully.",
        });

    } catch (error) {
        console.error("MongoDB Update Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update student.",
        });
    }
});
// ==========================================
// LINEAR SEARCH API
// ==========================================

app.get(
    "/api/search/linear/:rollNo",
    (req, res) => {

        const rollNo =
            Number(req.params.rollNo);

        if (Number.isNaN(rollNo)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid roll number.",
            });
        }

        execFile(
            cppEngine,
            [
                "linear-search",
                String(rollNo),
            ],
            {
                cwd: projectRoot,
            },
            (error, stdout, stderr) => {

                if (stderr) {
                    console.error(
                        "C++ Linear Search stderr:",
                        stderr
                    );
                }

                const output =
                    stdout.trim();

                if (error && !output) {
                    console.error(
                        "C++ Linear Search Error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Linear Search failed.",
                    });
                }

                const parts =
                    output.split("|");

                if (
                    parts[0] === "NOT_FOUND"
                ) {

                    return res.json({
                        success: true,
                        found: false,
                        comparisons:
                            Number(parts[1]),
                        algorithm:
                            "Linear Search",
                        timeComplexity: "O(n)",
                    });
                }

                if (
                    parts[0] === "FOUND"
                ) {

                    return res.json({
                        success: true,
                        found: true,

                        student: {
                            rollNo:
                                Number(parts[1]),
                            name: parts[2],
                            email: parts[3],
                            department: parts[4],
                            year: parts[5],
                            cgpa:
                                Number(parts[6]),
                            status:
                                parts[7],
                        },

                        comparisons:
                            Number(parts[8]),

                        algorithm:
                            "Linear Search",

                        timeComplexity:
                            "O(n)",
                    });
                }

                return res.status(500).json({
                    success: false,
                    message:
                        "Unexpected response from C++ Linear Search.",
                    output,
                });
            }
        );
    }
);


// ==========================================
// BINARY SEARCH API
// ==========================================

app.get(
    "/api/search/binary/:rollNo",
    (req, res) => {

        const rollNo =
            Number(req.params.rollNo);

        if (Number.isNaN(rollNo)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid roll number.",
            });
        }

        execFile(
            cppEngine,
            [
                "binary-search",
                String(rollNo),
            ],
            {
                cwd: projectRoot,
            },
            (error, stdout, stderr) => {

                if (stderr) {
                    console.error(
                        "C++ Binary Search stderr:",
                        stderr
                    );
                }

                const output =
                    stdout.trim();

                if (error && !output) {
                    console.error(
                        "C++ Binary Search Error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Binary Search failed.",
                    });
                }

                const parts =
                    output.split("|");

                if (
                    parts[0] === "NOT_FOUND"
                ) {

                    return res.json({
                        success: true,
                        found: false,
                        comparisons:
                            Number(parts[1]),
                        algorithm:
                            "Binary Search",
                        timeComplexity:
                            "O(log n)",
                    });
                }

                if (
                    parts[0] === "FOUND"
                ) {

                    return res.json({
                        success: true,
                        found: true,

                        student: {
                            rollNo:
                                Number(parts[1]),
                            name: parts[2],
                            email: parts[3],
                            department: parts[4],
                            year: parts[5],
                            cgpa:
                                Number(parts[6]),
                            status:
                                parts[7],
                        },

                        comparisons:
                            Number(parts[8]),

                        algorithm:
                            "Binary Search",

                        timeComplexity:
                            "O(log n)",
                    });
                }

                return res.status(500).json({
                    success: false,
                    message:
                        "Unexpected response from C++ Binary Search.",
                    output,
                });
            }
        );
    }
);

// ==========================================
// DSA LAB - LINEAR SEARCH
// ==========================================

app.get("/api/dsa-lab/linear-search", (req, res) => {
    const labLinearSearch = path.join(
        projectRoot,
        "dsa",
        "lab",
        "searching",
        "linear_search.exe"
    );

    execFile(
        labLinearSearch,
        [],
        {
            cwd: projectRoot,
        },
        (error, stdout, stderr) => {

            if (stderr) {
                console.error(
                    "DSA Lab Linear Search stderr:",
                    stderr
                );
            }

            const output = String(stdout || "").trim();

            if (error && !output) {
                console.error(
                    "DSA Lab Linear Search error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "DSA Lab Linear Search failed.",
                    error: error.message,
                });
            }

            const lines = output
                .split("\n")
                .filter(Boolean);

            const checks = lines
                .filter((line) =>
                    line.startsWith("CHECK|")
                )
                .map((line) => {
                    const parts = line.split("|");

                    return {
                        index: Number(parts[1]),
                        rollNo: Number(parts[2]),
                        name: parts[3] || "",
                    };
                });

            const foundLine = lines.find((line) =>
                line.startsWith("FOUND|")
            );

            const comparisonsLine = lines.find((line) =>
                line.startsWith("COMPARISONS|")
            );

            const complexityLine = lines.find((line) =>
                line.startsWith("COMPLEXITY|")
            );

            let found = null;

            if (foundLine) {
                const parts = foundLine.split("|");

                found = {
                    rollNo: Number(parts[1]),
                    name: parts[2] || "",
                };
            }

            res.json({
                success: true,
                algorithm: "Linear Search",
                checks,
                found,
                comparisons: comparisonsLine
                    ? Number(comparisonsLine.split("|")[1])
                    : 0,
                timeComplexity: complexityLine
                    ? complexityLine.split("|")[1]
                    : "O(n)",
            });
        }
    );
});

// ==========================================
// COMPARE LINEAR AND BINARY SEARCH
// ==========================================

app.get(
    "/api/search/compare/:rollNo",
    (req, res) => {

        const rollNo =
            Number(req.params.rollNo);

        if (Number.isNaN(rollNo)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid roll number.",
            });
        }

        const runSearch = (command) => {
            return new Promise((resolve, reject) => {

                execFile(
                    cppEngine,
                    [
                        command,
                        String(rollNo),
                    ],
                    {
                        cwd: projectRoot,
                    },
                    (error, stdout, stderr) => {

                        if (stderr) {
                            console.error(
                                `C++ ${command} stderr:`,
                                stderr
                            );
                        }

                        const output =
                            stdout.trim();

                        if (error && !output) {
                            reject(error);
                            return;
                        }

                        const parts =
                            output.split("|");

                        if (
                            parts[0] ===
                            "NOT_FOUND"
                        ) {
                            resolve({
                                found: false,
                                comparisons:
                                    Number(parts[1]),
                            });

                            return;
                        }

                        if (
                            parts[0] === "FOUND"
                        ) {
                            resolve({
                                found: true,

                                student: {
                                    rollNo:
                                        Number(parts[1]),
                                    name: parts[2],
                                    email: parts[3],
                                    department: parts[4],
                                    year: parts[5],
                                    cgpa:
                                        Number(parts[6]),
                                    status:
                                        parts[7],
                                },

                                comparisons:
                                    Number(parts[8]),
                            });

                            return;
                        }

                        reject(
                            new Error(
                                `Unexpected C++ response: ${output}`
                            )
                        );
                    }
                );
            });
        };

        Promise.all([
            runSearch("linear-search"),
            runSearch("binary-search"),
        ])
            .then(
                ([
                    linear,
                    binary,
                ]) => {

                    res.json({
                        success: true,

                        rollNo,

                        linearSearch: {
                            ...linear,
                            algorithm:
                                "Linear Search",
                            timeComplexity:
                                "O(n)",
                            spaceComplexity:
                                "O(1)",
                        },

                        binarySearch: {
                            ...binary,
                            algorithm:
                                "Binary Search",
                            timeComplexity:
                                "O(log n)",
                            spaceComplexity:
                                "O(1)",
                        },

                        comparisonDifference:
                            Math.abs(
                                linear.comparisons -
                                binary.comparisons
                            ),
                    });
                }
            )
            .catch((error) => {

                console.error(
                    "Search comparison error:",
                    error
                );

                res.status(500).json({
                    success: false,
                    message:
                        "Unable to compare search algorithms.",
                });
            });
    }
);

// ==========================================
// INSERTION SORT API
// ==========================================

app.get(
    "/api/sort/insertion",
    (req, res) => {

        execFile(
            cppEngine,
            [
                "insertion-sort",
            ],
            {
                cwd: projectRoot,
            },
            (error, stdout, stderr) => {

                if (stderr) {
                    console.error(
                        "C++ Insertion Sort stderr:",
                        stderr
                    );
                }

                const lines =
                    stdout
                        .trim()
                        .split("\n");

                if (
                    error &&
                    lines.length === 0
                ) {
                    console.error(
                        "C++ Insertion Sort Error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Insertion Sort failed.",
                    });
                }

                if (
                    !lines[0] ||
                    !lines[0].startsWith(
                        "SORTED|"
                    )
                ) {
                    return res.status(500).json({
                        success: false,
                        message:
                            "Unexpected response from C++ Insertion Sort.",
                        output: stdout,
                    });
                }

                const comparisonParts =
                    lines[0].split("|");

                const comparisons =
                    Number(
                        comparisonParts[1]
                    );

                const complexityLine =
                    lines.find((line) =>
                        line.startsWith(
                            "COMPLEXITY|"
                        )
                    );

                const students =
                    lines
                        .filter(
                            (line) =>
                                line &&
                                !line.startsWith(
                                    "SORTED|"
                                ) &&
                                !line.startsWith(
                                    "COMPLEXITY|"
                                )
                        )
                        .map((line) => {

                            const parts =
                                line.split("|");

                            return {
                                rollNo:
                                    Number(parts[0]),
                                name: parts[1],
                                email: parts[2],
                                department:
                                    parts[3],
                                year: parts[4],
                                cgpa:
                                    Number(parts[5]),
                                status:
                                    parts[6],
                            };
                        });

                res.json({
                    success: true,

                    algorithm:
                        "Insertion Sort",

                    students,

                    comparisons,

                    timeComplexity:
                        complexityLine
                            ? complexityLine.split("|")[1]
                            : "O(n^2)",

                    spaceComplexity:
                        "O(n)",
                });
            }
        );
    }
);

// ==========================================
// MERGE SORT API
// ==========================================

app.get(
    "/api/sort/merge",
    (req, res) => {

        execFile(
            cppEngine,
            [
                "merge-sort",
            ],
            {
                cwd: projectRoot,
            },
            (error, stdout, stderr) => {

                if (stderr) {
                    console.error(
                        "C++ Merge Sort stderr:",
                        stderr
                    );
                }

                const output =
                    stdout.trim();

                if (error && !output) {
                    console.error(
                        "C++ Merge Sort Error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Merge Sort failed.",
                    });
                }

                const lines =
                    output.split("\n");

                if (
                    !lines[0] ||
                    !lines[0].startsWith(
                        "SORTED|"
                    )
                ) {
                    return res.status(500).json({
                        success: false,
                        message:
                            "Unexpected response from C++ Merge Sort.",
                        output,
                    });
                }

                const comparisonParts =
                    lines[0].split("|");

                const comparisons =
                    Number(
                        comparisonParts[1]
                    );

                const complexityLine =
                    lines.find((line) =>
                        line.startsWith(
                            "COMPLEXITY|"
                        )
                    );

                const students =
                    lines
                        .filter(
                            (line) =>
                                line &&
                                !line.startsWith(
                                    "SORTED|"
                                ) &&
                                !line.startsWith(
                                    "COMPLEXITY|"
                                )
                        )
                        .map((line) => {

                            const parts =
                                line.split("|");

                            return {
                                rollNo:
                                    Number(parts[0]),
                                name: parts[1],
                                email: parts[2],
                                department:
                                    parts[3],
                                year: parts[4],
                                cgpa:
                                    Number(parts[5]),
                                status:
                                    parts[6],
                            };
                        });

                res.json({
                    success: true,

                    algorithm:
                        "Merge Sort",

                    students,

                    comparisons,

                    timeComplexity:
                        complexityLine
                            ? complexityLine.split("|")[1]
                            : "O(n log n)",

                    spaceComplexity:
                        "O(n)",
                });
            }
        );
    }
);

// ==========================================
// COMPARE INSERTION AND MERGE SORT
// ==========================================

app.get(
    "/api/sort/compare",
    (req, res) => {

        const runSort = (command) => {
            return new Promise((resolve, reject) => {

                execFile(
                    cppEngine,
                    [command],
                    {
                        cwd: projectRoot,
                    },
                    (error, stdout, stderr) => {

                        if (stderr) {
                            console.error(
                                `C++ ${command} stderr:`,
                                stderr
                            );
                        }

                        const output =
                            stdout.trim();

                        if (error && !output) {
                            reject(error);
                            return;
                        }

                        const lines =
                            output.split("\n");

                        if (
                            !lines[0] ||
                            !lines[0].startsWith(
                                "SORTED|"
                            )
                        ) {
                            reject(
                                new Error(
                                    `Unexpected ${command} response.`
                                )
                            );

                            return;
                        }

                        const comparisonParts =
                            lines[0].split("|");

                        const comparisons =
                            Number(
                                comparisonParts[1]
                            );

                        const complexityLine =
                            lines.find((line) =>
                                line.startsWith(
                                    "COMPLEXITY|"
                                )
                            );

                        const students =
                            lines
                                .filter(
                                    (line) =>
                                        line &&
                                        !line.startsWith(
                                            "SORTED|"
                                        ) &&
                                        !line.startsWith(
                                            "COMPLEXITY|"
                                        )
                                )
                                .map((line) => {

                                    const parts =
                                        line.split("|");

                                    return {
                                        rollNo:
                                            Number(parts[0]),
                                        name: parts[1],
                                        email: parts[2],
                                        department:
                                            parts[3],
                                        year: parts[4],
                                        cgpa:
                                            Number(parts[5]),
                                        status:
                                            parts[6],
                                    };
                                });

                        resolve({
                            students,
                            comparisons,

                            timeComplexity:
                                complexityLine
                                    ? complexityLine.split("|")[1]
                                    : "",

                            spaceComplexity:
                                "O(n)",
                        });
                    }
                );
            });
        };

        Promise.all([
            runSort("insertion-sort"),
            runSort("merge-sort"),
        ])
            .then(
                ([
                    insertion,
                    merge,
                ]) => {

                    res.json({
                        success: true,

                        insertionSort: {
                            algorithm:
                                "Insertion Sort",

                            ...insertion,
                        },

                        mergeSort: {
                            algorithm:
                                "Merge Sort",

                            ...merge,
                        },

                        comparisonDifference:
                            Math.abs(
                                insertion.comparisons -
                                merge.comparisons
                            ),
                    });
                }
            )
            .catch((error) => {

                console.error(
                    "Sort comparison error:",
                    error
                );

                res.status(500).json({
                    success: false,
                    message:
                        "Unable to compare sorting algorithms.",
                });
            });
    }
);


// ==========================================
// STACK / UNDO API
// ==========================================

app.get(
    "/api/stack/test",
    (req, res) => {

        execFile(
            cppEngine,
            ["stack-test"],
            {
                cwd: projectRoot,
            },
            (error, stdout, stderr) => {

                if (stderr) {
                    console.error(
                        "C++ Stack stderr:",
                        stderr
                    );
                }

                const lines =
                    stdout.trim().split("\n");

                if (error) {
                    console.error(
                        "C++ Stack error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Stack operation failed.",
                    });
                }

                const pushed =
                    lines.find(
                        (line) =>
                            line.startsWith("PUSHED|")
                    );

                const undo =
                    lines.find(
                        (line) =>
                            line.startsWith("UNDO|")
                    );

                const sizes =
                    lines
                        .filter((line) =>
                            line.startsWith(
                                "STACK_SIZE|"
                            )
                        )
                        .map((line) =>
                            Number(
                                line.split("|")[1]
                            )
                        );

                res.json({
                    success: true,

                    operation: "ADD",

                    pushed: Boolean(pushed),

                    undone: Boolean(undo),

                    stackSizeBeforeUndo:
                        sizes[0] ?? 0,

                    stackSizeAfterUndo:
                        sizes[1] ?? 0,

                    dataStructure:
                        "Stack",

                    principle:
                        "LIFO",
                });
            }
        );
    }
);

// ==========================================
// REAL UNDO API
// ==========================================
app.post("/api/undo", (req, res) => {
    execFile(
        cppEngine,
        ["undo"],
        {
            cwd: projectRoot,
        },
        (error, stdout, stderr) => {

            console.log(
                "UNDO STDOUT:",
                JSON.stringify(stdout)
            );

            console.log(
                "UNDO STDERR:",
                JSON.stringify(stderr)
            );

            console.log(
                "UNDO ERROR:",
                error
            );

            // C++ process itself failed
            if (error) {
                return res.status(500).json({
                    success: false,
                    message:
                        "C++ Undo process failed.",
                    error: error.message,
                });
            }

            const output =
                String(stdout || "").trim();

            // Successful Undo
            if (
                output.includes("UNDO_SUCCESS")
            ) {
                const parts =
                    output.split("|");

                return res.json({
                    success: true,
                    operation:
                        parts[1] || "",
                    rollNo:
                        Number(parts[2]) || 0,
                    studentName:
                        parts[3] || "",
                    message:
                        "Last operation was undone.",
                });
            }

            // Nothing to undo
            if (
                output.includes(
                    "NOTHING_TO_UNDO"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "There is nothing to undo.",
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to undo the last operation.",
                cppOutput: output,
            });
        }
    );
});

// ==========================================
// REDO API
// ==========================================

app.post("/api/redo", (req, res) => {
    execFile(
        cppEngine,
        ["redo"],
        {
            cwd: projectRoot,
        },
        (error, stdout, stderr) => {

            console.log(
                "REDO STDOUT:",
                JSON.stringify(stdout)
            );

            if (error) {
                return res.status(500).json({
                    success: false,
                    message:
                        "C++ Redo process failed.",
                });
            }

            const output =
                String(stdout || "").trim();

            if (
                output.includes("REDO_SUCCESS")
            ) {
                const parts =
                    output.split("|");

                return res.json({
                    success: true,

                    operation:
                        parts[1] || "",

                    rollNo:
                        Number(parts[2]) || 0,

                    studentName:
                        parts[3] || "",

                    message:
                        "Last operation was redone.",
                });
            }

            if (
                output.includes(
                    "NOTHING_TO_REDO"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "There is nothing to redo.",
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to redo the last operation.",
            });
        }
    );
});

// ==========================================
// QUEUE API
// ==========================================

app.get("/api/queue/test", (req, res) => {
    execFile(
        cppEngine,
        ["queue-test"],
        {
            cwd: projectRoot,
        },
        (error, stdout, stderr) => {

            console.log(
                "QUEUE STDOUT:",
                JSON.stringify(stdout)
            );

            if (error) {
                console.error(
                    "Queue C++ error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Queue operation failed.",
                });
            }

            const lines =
                String(stdout || "")
                    .trim()
                    .split("\n");

            const sizeBefore =
                lines.find(
                    (line) =>
                        line.startsWith(
                            "QUEUE_SIZE|"
                        )
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

            const sizes =
                lines
                    .filter((line) =>
                        line.startsWith(
                            "QUEUE_SIZE|"
                        )
                    )
                    .map((line) =>
                        Number(
                            line.split("|")[1]
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

            return res.json({
                success: true,

                dataStructure: "Queue",

                principle: "FIFO",

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
            });
        }
    );
});

// ==========================================
// LINKED LIST API
// ==========================================

app.get("/api/linked-list/test", (req, res) => {
    execFile(
        cppEngine,
        ["linked-list-test"],
        {
            cwd: projectRoot,
        },
        (error, stdout, stderr) => {

            console.log(
                "LINKED LIST STDOUT:",
                JSON.stringify(stdout)
            );

            if (error) {
                console.error(
                    "Linked List C++ error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Linked List operation failed.",
                });
            }

            const lines =
                String(stdout || "")
                    .trim()
                    .split("\n")
                    .filter(Boolean);

            const nodes = lines
                .filter((line) =>
                    line.startsWith("NODE|")
                )
                .map((line) => {
                    const parts =
                        line.split("|");

                    return {
                        rollNo:
                            Number(parts[1]) || 0,

                        name:
                            parts[2] || "",
                    };
                });

            const headLine =
                lines.find((line) =>
                    line.startsWith("HEAD|")
                );

            const tailLine =
                lines.find((line) =>
                    line.startsWith("TAIL|")
                );

            const sizeLine =
                lines.find((line) =>
                    line.startsWith("SIZE|")
                );

            const headParts =
                headLine
                    ? headLine.split("|")
                    : [];

            const tailParts =
                tailLine
                    ? tailLine.split("|")
                    : [];

            return res.json({
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
            });
        }
    );
});

// ==========================================
// DOUBLY LINKED LIST API
// ==========================================

app.get(
    "/api/doubly-linked-list/test",
    (req, res) => {

        execFile(
            cppEngine,
            ["doubly-linked-list-test"],
            {
                cwd: projectRoot,
            },
            (error, stdout, stderr) => {

                console.log(
                    "DOUBLY LINKED LIST STDOUT:",
                    JSON.stringify(stdout)
                );

                if (error) {
                    console.error(
                        "Doubly Linked List C++ error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Doubly Linked List operation failed.",
                    });
                }

                const lines =
                    String(stdout || "")
                        .trim()
                        .split("\n")
                        .filter(Boolean);

                const sizeLine =
                    lines.find((line) =>
                        line.startsWith("SIZE|")
                    );

                const headLine =
                    lines.find((line) =>
                        line.startsWith("HEAD|")
                    );

                const tailLine =
                    lines.find((line) =>
                        line.startsWith("TAIL|")
                    );

                const forwardIndex =
                    lines.indexOf("FORWARD");

                const backwardIndex =
                    lines.indexOf("BACKWARD");

                const forwardNodes =
                    forwardIndex !== -1 &&
                        backwardIndex !== -1
                        ? lines
                            .slice(
                                forwardIndex + 1,
                                backwardIndex
                            )
                            .filter((line) =>
                                line.startsWith("NODE|")
                            )
                        : [];

                const backwardNodes =
                    backwardIndex !== -1
                        ? lines
                            .slice(
                                backwardIndex + 1
                            )
                            .filter((line) =>
                                line.startsWith("NODE|")
                            )
                        : [];

                const parseNode =
                    (line) => {

                        const parts =
                            line.split("|");

                        return {
                            rollNo:
                                Number(parts[1]) || 0,

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

                return res.json({
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
                });
            }
        );
    }
);
// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(
        `DataNest API running at http://localhost:${PORT}`
    );
});