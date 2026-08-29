import API_URL from "../config/api";

import {
    useEffect,
    useState,
} from "react";

const initialStudents = [
    {
        rollNo: 101,
        name: "Rahul Sharma",
        department: "CSE",
        year: "2nd",
        cgpa: 8.9,
        status: "Active",
    },
    {
        rollNo: 102,
        name: "Aman Patil",
        department: "E&TC",
        year: "2nd",
        cgpa: 8.5,
        status: "Active",
    },
    {
        rollNo: 103,
        name: "Neha Joshi",
        department: "IT",
        year: "3rd",
        cgpa: 9.1,
        status: "Active",
    },
    {
        rollNo: 104,
        name: "Arjun Singh",
        department: "CSE",
        year: "1st",
        cgpa: 8.2,
        status: "Active",
    },
];

function Students() {
    const [students, setStudents] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [showForm, setShowForm] =
        useState(false);

    const [formData, setFormData] =
        useState({
            rollNo: "",
            name: "",
            email: "",
            department: "",
            year: "",
            cgpa: "",
        });

    const [formError, setFormError] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [apiError, setApiError] =
        useState("");

    const [editingStudent, setEditingStudent] =
        useState(null);

    useEffect(() => {
        const loadStudents = async () => {
            try {
                setLoading(true);
                setApiError("");

                const response = await fetch(
                    `${API_URL}/api/students`
                );

                if (!response.ok) {
                    throw new Error(
                        "Failed to load students."
                    );
                }

                const data =
                    await response.json();

                if (!data.success) {
                    throw new Error(
                        data.message ||
                        "Failed to load students."
                    );
                }

                setStudents(data.students);
            } catch (error) {
                console.error(
                    "Student API error:",
                    error
                );

                setApiError(
                    "Unable to connect to the DataNest DSA server."
                );
            } finally {
                setLoading(false);
            }
        };

        loadStudents();
    }, []);

    const filteredStudents =
        students.filter((student) =>
            student.name
                .toLowerCase()
                .includes(search.toLowerCase())
        );


    const handleFormChange = (event) => {
        const { name, value } =
            event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setFormError("");
    };


    const handleAddStudent = async (event) => {
        event.preventDefault();

        setFormError("");

        const rollNo = Number(formData.rollNo);
        const cgpa = Number(formData.cgpa);

        if (
            !formData.rollNo ||
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.department ||
            !formData.year ||
            formData.cgpa === ""
        ) {
            setFormError(
                "Please fill in all student fields."
            );

            return;
        }

        if (Number.isNaN(rollNo)) {
            setFormError(
                "Roll number must be a valid number."
            );

            return;
        }

        if (
            Number.isNaN(cgpa) ||
            cgpa < 0 ||
            cgpa > 10
        ) {
            setFormError(
                "CGPA must be between 0 and 10."
            );

            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/students`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        rollNo,
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        department:
                            formData.department,
                        year: formData.year,
                        cgpa,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to add student."
                );
            }

            // Reload students from C++ backend
            const studentsResponse =
                await fetch(
                    `${API_URL}/api/students`
                );

            const studentsData =
                await studentsResponse.json();

            if (!studentsResponse.ok) {
                throw new Error(
                    "Student was added, but records could not be refreshed."
                );
            }

            setStudents(
                studentsData.students
            );

            // Reset form
            setFormData({
                rollNo: "",
                name: "",
                email: "",
                department: "",
                year: "",
                cgpa: "",
            });

            setFormError("");

            // Close modal
            setShowForm(false);


        } catch (error) {
            console.error(
                "Add student error:",
                error
            );

            setFormError(
                error.message ||
                "Unable to add student."
            );
        }
    };

    const handleEditStudent = async (event) => {
        event.preventDefault();

        setFormError("");

        const cgpa = Number(formData.cgpa);

        if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.department ||
            !formData.year ||
            formData.cgpa === ""
        ) {
            setFormError(
                "Please fill in all student fields."
            );

            return;
        }

        if (
            Number.isNaN(cgpa) ||
            cgpa < 0 ||
            cgpa > 10
        ) {
            setFormError(
                "CGPA must be between 0 and 10."
            );

            return;
        }

        if (!editingStudent) {
            setFormError(
                "No student selected for editing."
            );

            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/students/${editingStudent.rollNo}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        name: formData.name.trim(),
                        email: formData.email.trim(),
                        department:
                            formData.department,
                        year: formData.year,
                        cgpa,
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to update student."
                );
            }

            // Get updated records from C++
            const studentsResponse =
                await fetch(
                    `${API_URL}/api/students`
                );

            const studentsData =
                await studentsResponse.json();

            if (
                !studentsResponse.ok ||
                !studentsData.success
            ) {
                throw new Error(
                    "Student was updated, but records could not be refreshed."
                );
            }

            setStudents(
                studentsData.students
            );

            // Reset editing state
            setEditingStudent(null);

            setFormData({
                rollNo: "",
                name: "",
                email: "",
                department: "",
                year: "",
                cgpa: "",
            });

            setFormError("");

            // Close form
            setShowForm(false);

        } catch (error) {
            console.error(
                "Edit student error:",
                error
            );

            setFormError(
                error.message ||
                "Unable to update student."
            );
        }
    };

    const startEditing = (student) => {
        setEditingStudent(student);

        setFormData({
            rollNo: String(student.rollNo),
            name: student.name,
            email: student.email || "",
            department: student.department,
            year: student.year,
            cgpa: String(student.cgpa),
        });

        setFormError("");
        setShowForm(true);
    };

    const handleDeleteStudent = async (rollNo) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to delete this student?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setApiError("");

            const response = await fetch(
                `${API_URL}/api/students/${rollNo}`,
                {
                    method: "DELETE",
                }
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Failed to delete student."
                );
            }

            // Reload students from C++ backend
            const studentsResponse =
                await fetch(
                    `${API_URL}/api/students`
                );

            const studentsData =
                await studentsResponse.json();

            if (
                !studentsResponse.ok ||
                !studentsData.success
            ) {
                throw new Error(
                    "Student was deleted, but records could not be refreshed."
                );
            }

            setStudents(
                studentsData.students
            );

        } catch (error) {
            console.error(
                "Delete student error:",
                error
            );

            setApiError(
                error.message ||
                "Unable to delete student."
            );
        }
    };


    return (
        <div>

            {apiError && (
                <div className="form-error">
                    {apiError}
                </div>
            )}

            {/* PAGE HEADER */}
            <div className="page-heading">

                <div>
                    <p className="eyebrow">
                        STUDENT MANAGEMENT
                    </p>

                    <h1>
                        Student Records
                    </h1>

                    <p>
                        Manage and organize student
                        information and academic records.
                    </p>
                </div>

                <button
                    className="primary-button"
                    type="button"
                    onClick={() => {
                        setShowForm(true);
                        setFormError("");
                    }}
                >
                    + Add Student
                </button>

            </div>

            {/* STUDENT TABLE CARD */}

            {showForm && (
                <section className="student-form-card">

                    <div className="section-header">
                        <div>
                            <h3>
                                {editingStudent
                                    ? "Edit Student"
                                    : "Add New Student"}
                            </h3>
                            <p>
                                {editingStudent
                                    ? "Update the student's academic information."
                                    : "Enter the student's academic information."}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                setShowForm(false);
                                setFormError("");
                            }}
                        >
                            Cancel
                        </button>
                    </div>

                    {formError && (
                        <div className="form-error">
                            {formError}
                        </div>
                    )}

                    <form
                        className="student-form"
                        onSubmit={
                            editingStudent
                                ? handleEditStudent
                                : handleAddStudent
                        }
                    >

                        <div className="form-group">
                            <label htmlFor="rollNo">
                                Roll Number
                            </label>

                            <input
                                id="rollNo"
                                name="rollNo"
                                type="number"
                                value={formData.rollNo}
                                onChange={handleFormChange}
                                placeholder="105"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="name">
                                Student Name
                            </label>

                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleFormChange}
                                placeholder="Enter student name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleFormChange}
                                placeholder="student@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="department">
                                Department
                            </label>

                            <select
                                id="department"
                                name="department"
                                value={formData.department}
                                onChange={handleFormChange}
                            >
                                <option value="">
                                    Select department
                                </option>

                                <option value="CSE">
                                    CSE
                                </option>

                                <option value="IT">
                                    IT
                                </option>

                                <option value="E&TC">
                                    E&TC
                                </option>

                                <option value="Mechanical">
                                    Mechanical
                                </option>

                                <option value="Civil">
                                    Civil
                                </option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="year">
                                Year
                            </label>

                            <select
                                id="year"
                                name="year"
                                value={formData.year}
                                onChange={handleFormChange}
                            >
                                <option value="">
                                    Select year
                                </option>

                                <option value="1st">
                                    1st
                                </option>

                                <option value="2nd">
                                    2nd
                                </option>

                                <option value="3rd">
                                    3rd
                                </option>

                                <option value="4th">
                                    4th
                                </option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="cgpa">
                                CGPA
                            </label>

                            <input
                                id="cgpa"
                                name="cgpa"
                                type="number"
                                min="0"
                                max="10"
                                step="0.01"
                                value={formData.cgpa}
                                onChange={handleFormChange}
                                placeholder="8.50"
                            />
                        </div>

                        <div className="student-form-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormError("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-button"
                            >
                                {editingStudent
                                    ? "Save Changes"
                                    : "Add Student"}
                            </button>

                        </div>

                    </form>

                </section>
            )}
            <section className="student-records-card">

                {/* HEADER */}
                <div className="section-header">

                    <div>
                        <h3>
                            All Students
                        </h3>

                        <p>
                            {students.length} student records
                        </p>
                    </div>

                    <div className="student-search">

                        <span>
                            🔍
                        </span>

                        <input
                            type="text"
                            placeholder="Search students..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                        />

                    </div>

                </div>

                {/* TABLE */}
                <div className="student-table-wrapper">

                    <table className="student-records-table">

                        <thead>
                            <tr>
                                <th>ROLL NO.</th>
                                <th>STUDENT</th>
                                <th>DEPARTMENT</th>
                                <th>YEAR</th>
                                <th>CGPA</th>
                                <th>STATUS</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="empty-state"
                                    >
                                        Loading student records...
                                    </td>
                                </tr>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.rollNo}>
                                        <td>
                                            #{student.rollNo}
                                        </td>

                                        <td>
                                            <div className="student-name-cell">
                                                <div className="student-avatar">
                                                    {student.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <strong>
                                                    {student.name}
                                                </strong>
                                            </div>
                                        </td>

                                        <td>
                                            {student.department}
                                        </td>

                                        <td>
                                            {student.year}
                                        </td>

                                        <td>
                                            <strong>
                                                {student.cgpa}
                                            </strong>
                                        </td>

                                        <td>
                                            <span className="status-badge">
                                                {student.status}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="student-actions">

                                                <button
                                                    type="button"
                                                    className="table-action edit"
                                                    onClick={() =>
                                                        startEditing(student)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="table-action delete"
                                                    onClick={() =>
                                                        handleDeleteStudent(
                                                            student.rollNo
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="empty-state"
                                    >
                                        No students found.
                                    </td>
                                </tr>
                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
}

export default Students;