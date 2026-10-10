import API_URL, { apiFetch } from "./config/api";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import DashboardLayout from "./layouts/DashboardLayout";



import StudentRegister from "./pages/StudentRegister";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentDashboard from "./pages/StudentDashboard";
import Students from "./pages/Students";
import MyProfile from "./pages/MyProfile";
import TeacherProfile from "./pages/TeacherProfile";
import Search from "./pages/Search";
import Sorting from "./pages/Sorting";
import Stack from "./pages/Stack";
import Queue from "./pages/Queue";
import LinkedList from "./pages/LinkedList";
import DSALab from "./pages/DSALab";
import Requests from "./pages/Requests";

import {
  Users,
  Building2,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

import StatCard from "./components/StatCard";
import StudentTable from "./components/StudentTable";

// ==========================================
// TEACHER DASHBOARD
// ==========================================

function Dashboard() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await apiFetch(
          `/api/students`
        );

        if (!response.ok) {
          throw new Error("Failed to load students");
        }

        const result = await response.json();

        const data = Array.isArray(result)
          ? result
          : result.students || result.data || [];

        setStudents(data);
      } catch (error) {
        console.error(
          "Dashboard API Error:",
          error
        );

        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadStudents();
  }, []);

  // Load pending requests
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await apiFetch(
          "/api/requests"
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
            "Failed to load requests"
          );
        }

        const requests = Array.isArray(result.requests)
          ? result.requests
          : [];

        const pending = requests.filter(
          (request) =>
            request.status === "Pending"
        ).length;

        setPendingRequests(pending);

      } catch (error) {
        console.error(
          "Request count error:",
          error
        );

        setPendingRequests(0);
      }
    };

    loadRequests();
  }, []);

  const totalStudents = students.length;

  const averageAttendance =
    students.length > 0
      ? (
        students.reduce(
          (sum, student) =>
            sum + Number(student.attendance || 0),
          0
        ) / students.length
      ).toFixed(2)
      : "0.00";

  const departments = new Set(
    students
      .map((student) => student.department)
      .filter(Boolean)
  ).size;

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            TEACHER PORTAL
          </p>

          <h1>
            Student Monitoring
          </h1>

          <p>
            Monitor and manage your student records.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/students")}
        >
          + Add Student
        </button>
      </div>

      <section className="stats-grid">

        <StatCard
          title="Total Students"
          value={
            loading
              ? "..."
              : String(totalStudents)
          }
          description="Across all student records"
          trend=""
          icon={Users}
        />

        <StatCard
          title="Average Attendance"
          value={
            loading
              ? "..."
              : `${averageAttendance}%`
          }
          description="Across all students"
          trend=""
          icon={GraduationCap}
        />

        <StatCard
          title="Departments"
          value={
            loading
              ? "..."
              : String(departments)
          }
          description="Active departments"
          icon={Building2}
        />

        <StatCard
          title="Pending Requests"
          value={pendingRequests}
          description="Needs your attention"
          icon={ClipboardList}
        />

      </section>

      <section className="dashboard-grid">

        <StudentTable />

        <div className="activity-card">

          <div className="section-header">
            <div>
              <h3>DSA Activity</h3>

              <p>
                Recent data structure operations
              </p>
            </div>
          </div>

          <div className="activity-list">

            <div className="activity-item">
              <div className="activity-icon linked">
                LL
              </div>

              <div>
                <strong>
                  Student inserted
                </strong>

                <span>
                  Linked List • Student record
                </span>
              </div>

              <small>2m</small>
            </div>

            <div className="activity-item">
              <div className="activity-icon search">
                S
              </div>

              <div>
                <strong>
                  Student searched
                </strong>

                <span>
                  Binary Search
                </span>
              </div>

              <small>8m</small>
            </div>

            <div className="activity-item">
              <div className="activity-icon stack">
                ST
              </div>

              <div>
                <strong>
                  Undo operation
                </strong>

                <span>
                  Stack • Student operation
                </span>
              </div>

              <small>15m</small>
            </div>

            <div className="activity-item">
              <div className="activity-icon queue">
                Q
              </div>

              <div>
                <strong>
                  Request enqueued
                </strong>

                <span>
                  Queue • Certificate
                </span>
              </div>

              <small>21m</small>
            </div>

          </div>
        </div>

        <div className="table-card" style={{ marginTop: "24px" }}>
          <div className="section-header">
            <div>
              <h3>Student Overview</h3>
              <p>Students by department</p>
            </div>
          </div>

          <div style={{ padding: "20px" }}>
            {Object.entries(
              students.reduce((acc, student) => {
                const department = student.department || "Unknown";

                acc[department] = (acc[department] || 0) + 1;

                return acc;
              }, {})
            ).map(([department, count]) => (
              <div
                key={department}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom: "1px solid #eef1f4",
                }}
              >
                <span>{department}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </div>

      </section>
    </>
  );
}
// ==========================================
// PLACEHOLDER PAGE
// ==========================================

function PlaceholderPage({
  title,
  description,
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">
          DATANEST
        </p>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>
    </div>
  );
}

// ==========================================
// STUDENT REQUESTS
// ==========================================

function MyRequests() {
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await apiFetch(
          "/api/my-requests"
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
            "Failed to load your requests."
          );
        }

        setRequests(
          Array.isArray(data.requests)
            ? data.requests
            : []
        );

      } catch (error) {
        console.error(
          "My requests error:",
          error
        );

        setRequests([]);
      }
    };

    if (user?.studentRollNo) {
      loadRequests();
    }
  }, [user?.studentRollNo]);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            STUDENT PORTAL
          </p>

          <h1>My Requests</h1>

          <p>
            Track your submitted service requests.
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="section-header">
          <div>
            <h3>Service Requests</h3>

            <p>
              Your recent requests
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div
            style={{
              padding: "25px",
              color: "#68757e",
              fontSize: "13px",
            }}
          >
            No active requests yet.
          </div>
        ) : (
          <div
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {requests
              .slice()
              .reverse()
              .map((request) => (
                <div
                  key={request.id}
                  style={{
                    border: "1px solid #e2e7ec",
                    borderRadius: "10px",
                    padding: "16px",
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          fontSize: "14px",
                        }}
                      >
                        {request.type}
                      </strong>

                      <p
                        style={{
                          margin:
                            "6px 0 0",
                          color: "#68757e",
                          fontSize: "13px",
                        }}
                      >
                        {request.message}
                      </p>
                    </div>

                    <span
                      style={{
                        padding:
                          "5px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background:
                          request.status ===
                            "Approved"
                            ? "#e8f7ef"
                            : request.status ===
                              "Rejected"
                              ? "#fdecec"
                              : "#fff4d6",
                        color:
                          request.status ===
                            "Approved"
                            ? "#18805b"
                            : request.status ===
                              "Rejected"
                              ? "#c0392b"
                              : "#9a6b00",
                      }}
                    >
                      {request.status}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "10px",
                      borderTop:
                        "1px solid #edf0f2",
                      fontSize: "11px",
                      color: "#8a969f",
                    }}
                  >
                    Submitted:{" "}
                    {request.createdAt}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
// ==========================================
// MAIN APP
// ==========================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ================================= */}
        {/* LOGIN - NO SIDEBAR */}
        {/* ================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/student-register"
          element={<StudentRegister />}
        />

        <Route
          path="/teacher-profile"
          element={
            <ProtectedRoute role="teacher">
              <TeacherProfile />
            </ProtectedRoute>
          }
        />

        {/* ================================= */}
        {/* ALL APPLICATION PAGES */}
        {/* ================================= */}

        <Route
          element={<DashboardLayout />}
        >

          {/* DEFAULT */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {/* =============================== */}
          {/* TEACHER */}
          {/* =============================== */}

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="teacher">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/students"
            element={
              <ProtectedRoute role="teacher">
                <Students />
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={<Search />}
          />

          <Route
            path="/sorting"
            element={<Sorting />}
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute role="teacher">
                <Requests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/stack"
            element={<Stack />}
          />

          <Route
            path="/queue"
            element={<Queue />}
          />

          <Route
            path="/linked-list"
            element={<LinkedList />}
          />

          <Route path="/dsalab/*" element={<DSALab />} />



          {/* =============================== */}
          {/* STUDENT */}
          {/* =============================== */}

          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-profile"
            element={
              <ProtectedRoute role="student">
                <MyProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-requests"
            element={
              <ProtectedRoute role="student">
                <MyRequests />
              </ProtectedRoute>
            }
          />

          {/* =============================== */}
          {/* UNKNOWN ROUTE */}
          {/* =============================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;