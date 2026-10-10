import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, AlertCircle } from "lucide-react";
import API_URL from "../config/api";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!name.trim()) {
            setError("Please enter your name.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter your email.");
            return;
        }

        if (!password) {
            setError("Please enter a password.");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim().toLowerCase(),
                        password,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                setError(
                    data.message || "Registration failed."
                );
                return;
            }

            setSuccess(
                "Account created successfully. Redirecting to login..."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (error) {
            console.error("Registration error:", error);
            setError(
                "Unable to connect to DataNest server."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">

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
                        Create your DataNest account.
                    </h2>

                    <p>
                        Manage student records and
                        data-structure-powered operations
                        in one platform.
                    </p>
                </div>

                <div className="login-brand-footer">
                    DataNest • Academic Management Platform
                </div>
            </div>

            <div className="login-form-panel">
                <form
                    className="login-card"
                    onSubmit={handleRegister}
                >
                    <div className="mobile-login-logo">
                        <div className="login-brand-icon">
                            <GraduationCap size={24} />
                        </div>

                        <strong>DataNest</strong>
                    </div>

                    <div className="login-heading">
                        <p className="eyebrow">
                            GET STARTED
                        </p>

                        <h2>Create an account</h2>

                        <p>
                            Register your DataNest teacher
                            account.
                        </p>
                    </div>

                    {error && (
                        <div className="login-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="login-success">
                            {success}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">
                            Full Name
                        </label>

                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            placeholder="Enter your name"
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="Enter your email"
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Create a password"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Confirm your password"
                            autoComplete="new-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>

                    <p
                        style={{
                            textAlign: "center",
                            marginTop: "18px",
                            fontSize: "13px",
                        }}
                    >
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                fontWeight: "600",
                            }}
                        >
                            Sign in
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Register;