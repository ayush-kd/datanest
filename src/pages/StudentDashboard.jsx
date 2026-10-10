import {
  GraduationCap,
  ClipboardList,
  BookOpen,
  Send,
} from "lucide-react";

import { useEffect, useState } from "react";
import { apiFetch } from "../config/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

function StudentDashboard() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);

  useEffect(() => {
    const loadStudent = async () => {
      try {
        setStudentLoading(true);

        const response = await apiFetch("/api/students");
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Failed to load student data."
          );
        }

        const students = Array.isArray(result.students)
          ? result.students
          : [];

        const myStudent =
          students.find(
            (item) =>
              Number(item.rollNo) ===
              Number(user?.studentRollNo)
          ) || students[0];

        setStudent(myStudent || null);
      } catch (error) {
        console.error(
          "Student dashboard API error:",
          error
        );
        setStudent(null);
      } finally {
        setStudentLoading(false);
      }
    };

    if (user?.studentRollNo) {
      loadStudent();
    }
  }, [user?.studentRollNo]);

  const [requestType, setRequestType] = useState("Bonafide Certificate");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);

  const submitRequest = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      alert("Please enter your request message.");
      return;
    }

    try {
      setRequestLoading(true);
      setSuccess(false);

      const response = await apiFetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestType,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to send request."
        );
      }

      setMessage("");
      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (error) {
      console.error(
        "Request submit error:",
        error
      );

      alert(
        error.message ||
        "Unable to send request."
      );
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            STUDENT PORTAL
          </p>

          <h1>
            Welcome back, {user?.name || "Student"} 👋
          </h1>

          <p>
            Here's your academic overview.
          </p>
        </div>
      </div>

      <section className="stats-grid">

        <StatCard
          title="Current CGPA"
          value={
            studentLoading
              ? "..."
              : student?.cgpa ?? "-"
          }
          description="Overall academic performance"
          icon={GraduationCap}
        />

        <StatCard
          title="Year"
          value={
            studentLoading
              ? "..."
              : student?.year ?? "-"
          }
          description="Current academic year"
          icon={BookOpen}
        />

        <StatCard
          title="Attendance"
          value={
            studentLoading
              ? "..."
              : `${student?.attendance ?? 0}%`
          }
          description="Overall attendance"
          icon={ClipboardList}
        />

        <StatCard
          title="Department"
          value={
            studentLoading
              ? "..."
              : student?.department ?? "-"
          }
          description="Current department"
          icon={BookOpen}
        />

      </section>

      {/* SEND REQUEST */}
      <div className="table-card" style={{ marginTop: "24px" }}>
        <div className="section-header">
          <div>
            <h3>Send Service Request</h3>
            <p>
              Submit a request to your teacher.
            </p>
          </div>
        </div>

        <form
          onSubmit={submitRequest}
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Request Type
            </label>

            <select
              value={requestType}
              onChange={(e) =>
                setRequestType(e.target.value)
              }
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid #d9e0e7",
                borderRadius: "8px",
                fontSize: "13px",
                background: "#fff",
              }}
            >
              <option>Bonafide Certificate</option>
              <option>Fee Receipt</option>
              <option>ID Card</option>
              <option>Marksheet</option>
              <option>Leave Application</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "7px",
                fontSize: "13px",
                fontWeight: "600",
              }}
            >
              Message
            </label>

            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Enter your request..."
              rows="4"
              style={{
                width: "100%",
                padding: "11px 12px",
                border: "1px solid #d9e0e7",
                borderRadius: "8px",
                fontSize: "13px",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            <button
              type="submit"
              className="primary-button"
              disabled={requestLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Send size={15} />

              {requestLoading
                ? "Sending..."
                : "Submit Request"}
            </button>

            {success && (
              <span
                style={{
                  color: "#18805b",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                ✓ Request submitted successfully
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ACADEMIC OVERVIEW */}
      <div
        className="table-card"
        style={{ marginTop: "24px" }}
      >
        <div className="section-header">
          <div>
            <h3>Academic Overview</h3>
            <p>
              Your recent academic information
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            color: "#68757e",
            fontSize: "13px",
          }}
        >
          Your detailed academic records will
          appear here.
        </div>
      </div>
    </>
  );
}

export default StudentDashboard;