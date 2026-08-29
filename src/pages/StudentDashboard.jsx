import {
  GraduationCap,
  ClipboardList,
  BookOpen,
  Send,
} from "lucide-react";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

function StudentDashboard() {
  const { user } = useAuth();
  const [requestType, setRequestType] = useState("Bonafide Certificate");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const submitRequest = (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    const newRequest = {
      id: Date.now(),
      student: user?.name || "Student",
      rollNo: user?.rollNo || null,
      email: user?.email || "",
      type: requestType,
      message: message.trim(),
      status: "Pending",
      createdAt: new Date().toLocaleString(),
    };

    const existingRequests =
      JSON.parse(localStorage.getItem("studentRequests")) || [];

    localStorage.setItem(
      "studentRequests",
      JSON.stringify([...existingRequests, newRequest])
    );

    setMessage("");
    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);
    }, 3000);
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
          value="8.9"
          description="Overall academic performance"
          trend="+0.2"
          icon={GraduationCap}
        />

        <StatCard
          title="Semester"
          value="4"
          description="Current semester"
          icon={BookOpen}
        />

        <StatCard
          title="Attendance"
          value="87%"
          description="Overall attendance"
          trend="+3%"
          icon={ClipboardList}
        />

        <StatCard
          title="Requests"
          value="2"
          description="Active requests"
          icon={ClipboardList}
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
              }}
            >
              <Send size={15} />
              Submit Request
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