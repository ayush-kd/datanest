import API_URL from "../config/api";
import { useEffect, useState } from "react";

function StudentTable() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/students`
        );

        if (!response.ok) {
          throw new Error("Failed to load students");
        }

        const result = await response.json();

        // Backend agar direct array ya object dono mein data bheje
        const data = Array.isArray(result)
          ? result
          : result.students || result.data || [];

        setStudents(data);
      } catch (error) {
        console.error(
          "Dashboard student load error:",
          error
        );
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Latest 5 students
  const recentStudents = students.slice(-5).reverse();

  return (
    <div className="table-card">
      <div className="section-header">
        <div>
          <h3>Recent Students</h3>
          <p>Recently added student records</p>
        </div>

        <a href="/students" className="view-all">
          View all
        </a>
      </div>

      <div className="table-wrapper">
        {loading ? (
          <div style={{ padding: "25px" }}>
            Loading students...
          </div>
        ) : recentStudents.length === 0 ? (
          <div style={{ padding: "25px" }}>
            No students found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Roll No.</th>
                <th>Student</th>
                <th>Department</th>
                <th>Year</th>
                <th>CGPA</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {recentStudents.map((student) => (
                <tr key={student.rollNo}>
                  <td>#{student.rollNo}</td>

                  <td>
                    <div className="student-cell">
                      <div className="student-avatar">
                        {student.name?.charAt(0) || "S"}
                      </div>

                      <strong>{student.name}</strong>
                    </div>
                  </td>

                  <td>{student.department}</td>

                  <td>{student.year}</td>

                  <td>
                    <strong>{student.cgpa}</strong>
                  </td>

                  <td>
                    <span className="status-badge">
                      {student.status || "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default StudentTable;