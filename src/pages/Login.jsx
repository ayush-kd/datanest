import {
  useEffect,
  useState,
} from "react";

import {
  GraduationCap,
  Eye,
  EyeOff,
  Users,
  UserRound,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();

  const { login, isAuthenticated, user } =
    useAuth();

  const [showPassword, setShowPassword] =
    useState(false);

  const [role, setRole] =
    useState("teacher");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  // --------------------------------
  // IF ALREADY LOGGED IN
  // --------------------------------

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    if (user.role === "teacher") {
      navigate("/dashboard", {
        replace: true,
      });
    } else if (user.role === "student") {
      navigate("/student-dashboard", {
        replace: true,
      });
    }
  }, [
    isAuthenticated,
    user,
    navigate,
  ]);

  // --------------------------------
  // LOGIN
  // --------------------------------

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    // Basic validation
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const result = await login({
        email: email.trim(),
        password,
        role,
      });

      if (!result.success) {
        setError(result.message || "Login failed.");
        setLoading(false);
        return;
      }

      if (result.user.role === "teacher") {
        navigate("/dashboard", {
          replace: true,
        });
      } else if (result.user.role === "student") {
        navigate("/student-dashboard", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };


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
            DSA POWERED PLATFORM
          </span>

          <h2>
            Smarter student records.
            <br />
            Better academic management.
          </h2>

          <p>
            DataNest brings student records,
            academic information and
            data-structure-powered operations
            together in one platform.
          </p>

        </div>

        <div className="login-features">

          <div>

            <span className="feature-icon">
              <Users size={17} />
            </span>

            <div>

              <strong>
                Student Management
              </strong>

              <p>
                Manage student records efficiently.
              </p>

            </div>

          </div>

          <div>

            <span className="feature-icon">
              <ShieldCheck size={17} />
            </span>

            <div>

              <strong>
                DSA Powered
              </strong>

              <p>
                Linked Lists, Stack, Queue,
                Search and Sort.
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

        <form
          className="login-card"
          onSubmit={handleLogin}
        >



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
              WELCOME BACK
            </p>

            <h2>
              Sign in to DataNest
            </h2>

            <p>
              Enter your credentials to continue.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="login-error">

              <AlertCircle size={16} />

              <span>
                {error}
              </span>

            </div>
          )}

          {/* EMAIL */}

          <div className="form-group">

            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="email"
            />

          </div>

          {/* PASSWORD */}

          <div className="form-group">

            <div className="label-row">

              <label htmlFor="password">
                Password
              </label>

              <button
                type="button"
                className="forgot-button"
                onClick={() =>
                  setError(
                    "Password recovery will be available after backend authentication is added."
                  )
                }
              >
                Forgot password?
              </button>

            </div>

            <div className="password-input">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                className="password-toggle"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

          </div>

          {/* ROLE */}

          <div className="form-group">

            <label>
              Sign in as
            </label>

            <div className="role-selector">

              {/* TEACHER */}

              <button
                type="button"
                className={`role-option ${role === "teacher"
                  ? "selected"
                  : ""
                  }`}
                onClick={() => {
                  setRole("teacher");
                  setError("");
                }}
              >

                <div className="role-option-icon">
                  <UserRound size={18} />
                </div>

                <div>

                  <strong>
                    Teacher
                  </strong>

                  <span>
                    Faculty account
                  </span>

                </div>

              </button>

              {/* STUDENT */}

              <button
                type="button"
                className={`role-option ${role === "student"
                  ? "selected"
                  : ""
                  }`}
                onClick={() => {
                  setRole("student");
                  setError("");
                }}
              >

                <div className="role-option-icon">
                  <GraduationCap size={18} />
                </div>

                <div>

                  <strong>
                    Student
                  </strong>

                  <span>
                    Student account
                  </span>

                </div>

              </button>

            </div>

          </div>

          {/* LOGIN */}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </button>

          <div
            style={{
              textAlign: "center",
              marginTop: "18px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            {role === "teacher" ? (
              <>
                Don't have a teacher account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#0f9fa3",
                  }}
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                New student?{" "}
                <button
                  type="button"
                  onClick={() =>
                    navigate("/student-register")
                  }
                  style={{
                    border: "none",
                    background: "none",
                    padding: 0,
                    cursor: "pointer",
                    fontWeight: "600",
                    color: "#0f9fa3",
                  }}
                >
                  Create student account
                </button>
              </>
            )}
          </div>

          {/* DEMO ACCOUNT */}



        </form>

      </div>

    </div>
  );
}

export default Login;
