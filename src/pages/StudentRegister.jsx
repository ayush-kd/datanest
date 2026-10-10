import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  GraduationCap,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

import API_URL from "../config/api";

export default function StudentRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    rollNo: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setMessageType("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!form.email.trim()) {
      setMessage("Please enter your student email.");
      setMessageType("error");
      return;
    }

    if (!form.rollNo) {
      setMessage("Please enter your roll number.");
      setMessageType("error");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    if (form.password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/student-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email.trim(),
            rollNo: Number(form.rollNo),
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setMessage(
          data.message || "Registration failed."
        );
        setMessageType("error");
        return;
      }

      setMessage(
        "Account created successfully! Redirecting to login..."
      );
      setMessageType("success");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error(
        "Student registration error:",
        error
      );

      setMessage(
        "Unable to connect to DataNest server."
      );
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">

      {/* ============================ */}
      {/* LEFT SIDE */}
      {/* ============================ */}

      <div className="login-brand-panel">

        <div className="login-brand">

          <div className="login-brand-icon">
            <GraduationCap size={28} />
          </div>

          <div>
            <h1>DataNest</h1>

            <p>
              Intelligent Student Record
              Management System
            </p>
          </div>

        </div>

        <div className="login-hero">

          <span className="login-badge">
            STUDENT PORTAL
          </span>

          <h2>
            Your academic journey.
            <br />
            One secure place.
          </h2>

          <p>
            Create your DataNest student account
            using the email and roll number
            provided by your teacher.
          </p>

        </div>

        <div className="login-features">

          <div>

            <span className="feature-icon">
              <Users size={17} />
            </span>

            <div>

              <strong>
                Connected with your teacher
              </strong>

              <p>
                Your account is linked to your
                assigned student record.
              </p>

            </div>

          </div>

          <div>

            <span className="feature-icon">
              <ShieldCheck size={17} />
            </span>

            <div>

              <strong>
                Secure Student Account
              </strong>

              <p>
                Your academic information stays
                connected to your account.
              </p>

            </div>

          </div>

        </div>

        <div className="login-brand-footer">
          DataNest • Academic Management Platform
        </div>

      </div>

      {/* ============================ */}
      {/* RIGHT SIDE */}
      {/* ============================ */}

      <div className="login-form-panel">

        <div className="login-card">

          {/* MOBILE LOGO */}

          <div className="mobile-login-logo">

            <div className="login-brand-icon">
              <GraduationCap size={24} />
            </div>

            <strong>
              DataNest
            </strong>

          </div>

          {/* HEADING */}

          <div className="login-heading">

            <p className="eyebrow">
              STUDENT REGISTRATION
            </p>

            <h2>
              Create your student account
            </h2>

            <p>
              Use the email and roll number
              provided by your teacher.
            </p>

          </div>

          {/* MESSAGE */}

          {message && (
            <div
              className={
                messageType === "success"
                  ? "login-success"
                  : "login-error"
              }
            >

              {messageType === "success" ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}

              <span>
                {message}
              </span>

            </div>
          )}

          {/* FORM */}

          <form onSubmit={handleSubmit}>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="student-email">
                Student Email
              </label>

              <input
                id="student-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email provided by teacher"
                autoComplete="email"
                required
              />

            </div>

            {/* ROLL NUMBER */}

            <div className="form-group">

              <label htmlFor="student-roll">
                Roll Number
              </label>

              <input
                id="student-roll"
                type="number"
                name="rollNo"
                value={form.rollNo}
                onChange={handleChange}
                placeholder="Enter your roll number"
                min="1"
                required
              />

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="student-password">
                Password
              </label>

              <input
                id="student-password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="student-confirm-password">
                Confirm Password
              </label>

              <input
                id="student-confirm-password"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
              />

            </div>

            {/* REGISTER */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Creating Account..."
                : "Create Student Account"}
            </button>

          </form>

          {/* BACK TO LOGIN */}

          <div
            style={{
              textAlign: "center",
              marginTop: "18px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >

            Already have a student account?{" "}

            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{
                border: "none",
                background: "none",
                padding: 0,
                cursor: "pointer",
                fontWeight: "600",
                color: "#0f9fa3",
              }}
            >
              Sign in
            </button>

          </div>

          {/* INFORMATION NOTE */}

          <div
            style={{
              marginTop: "20px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#f0fafa",
              border: "1px solid #d7eeee",
              fontSize: "12px",
              lineHeight: "1.5",
              color: "#64748b",
            }}
          >
            <strong
              style={{
                color: "#334155",
              }}
            >
              Important:
            </strong>{" "}
            Your email and roll number must match
            the student record created by your
            teacher.
          </div>

          <p className="login-note">
            DataNest • Student Account Registration
          </p>

        </div>

      </div>

    </div>
  );
}