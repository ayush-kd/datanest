import { useEffect, useState } from "react";
import {
    Check,
    X,
    ClipboardList,
} from "lucide-react";

function Requests() {
    const [requests, setRequests] = useState([]);

    // =====================================
    // LOAD REQUESTS
    // =====================================

    const loadRequests = () => {
        const savedRequests =
            JSON.parse(
                localStorage.getItem("studentRequests")
            ) || [];

        setRequests(savedRequests);
    };

    useEffect(() => {
        loadRequests();

        // Update when another tab changes requests
        const handleStorage = (event) => {
            if (event.key === "studentRequests") {
                loadRequests();
            }
        };

        window.addEventListener(
            "storage",
            handleStorage
        );

        return () => {
            window.removeEventListener(
                "storage",
                handleStorage
            );
        };
    }, []);

    // =====================================
    // UPDATE REQUEST STATUS
    // =====================================

    const updateStatus = (id, status) => {
        const savedRequests =
            JSON.parse(
                localStorage.getItem("studentRequests")
            ) || [];

        const updatedRequests =
            savedRequests.map((request) =>
                request.id === id
                    ? {
                        ...request,
                        status,
                        updatedAt:
                            new Date().toLocaleString(),
                    }
                    : request
            );

        localStorage.setItem(
            "studentRequests",
            JSON.stringify(updatedRequests)
        );

        setRequests(updatedRequests);
    };

    // =====================================
    // COUNTS
    // =====================================

    const pendingCount = requests.filter(
        (request) =>
            request.status === "Pending"
    ).length;

    const approvedCount = requests.filter(
        (request) =>
            request.status === "Approved"
    ).length;

    const rejectedCount = requests.filter(
        (request) =>
            request.status === "Rejected"
    ).length;

    return (
        <>
            {/* ================================= */}
            {/* PAGE HEADER */}
            {/* ================================= */}

            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        DATANEST
                    </p>

                    <h1>Student Requests</h1>

                    <p>
                        Review and manage student service
                        requests.
                    </p>
                </div>
            </div>

            {/* ================================= */}
            {/* REQUEST STATS */}
            {/* ================================= */}

            <section className="stats-grid">
                <div className="stat-card">
                    <div>
                        <p className="stat-label">
                            Total Requests
                        </p>

                        <h2>{requests.length}</h2>

                        <span>
                            All submitted requests
                        </span>
                    </div>

                    <ClipboardList size={22} />
                </div>

                <div className="stat-card">
                    <div>
                        <p className="stat-label">
                            Pending
                        </p>

                        <h2>{pendingCount}</h2>

                        <span>
                            Needs your attention
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <p className="stat-label">
                            Approved
                        </p>

                        <h2>{approvedCount}</h2>

                        <span>
                            Successfully approved
                        </span>
                    </div>
                </div>

                <div className="stat-card">
                    <div>
                        <p className="stat-label">
                            Rejected
                        </p>

                        <h2>{rejectedCount}</h2>

                        <span>
                            Rejected requests
                        </span>
                    </div>
                </div>
            </section>

            {/* ================================= */}
            {/* REQUEST LIST */}
            {/* ================================= */}

            <div
                className="table-card"
                style={{ marginTop: "24px" }}
            >
                <div className="section-header">
                    <div>
                        <h3>Service Requests</h3>

                        <p>
                            Requests submitted by students
                        </p>
                    </div>
                </div>

                {requests.length === 0 ? (
                    <div
                        style={{
                            padding: "30px",
                            textAlign: "center",
                            color: "#68757e",
                            fontSize: "13px",
                        }}
                    >
                        No student requests yet.
                    </div>
                ) : (
                    <div
                        style={{
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "14px",
                        }}
                    >
                        {requests
                            .slice()
                            .reverse()
                            .map((request) => (
                                <div
                                    key={request.id}
                                    style={{
                                        border:
                                            "1px solid #e2e7ec",
                                        borderRadius: "10px",
                                        padding: "18px",
                                        background: "#fff",
                                    }}
                                >
                                    {/* TOP */}
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                            alignItems: "flex-start",
                                            gap: "20px",
                                        }}
                                    >
                                        <div>
                                            <h3
                                                style={{
                                                    margin: 0,
                                                    fontSize: "15px",
                                                }}
                                            >
                                                {request.type}
                                            </h3>

                                            <p
                                                style={{
                                                    margin:
                                                        "6px 0 0",
                                                    fontSize: "13px",
                                                    color:
                                                        "#68757e",
                                                }}
                                            >
                                                {request.message}
                                            </p>
                                        </div>

                                        {/* STATUS */}
                                        <span
                                            style={{
                                                padding:
                                                    "5px 11px",
                                                borderRadius: "20px",
                                                fontSize: "11px",
                                                fontWeight: "700",
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

                                    {/* STUDENT INFO */}
                                    <div
                                        style={{
                                            marginTop: "15px",
                                            paddingTop: "13px",
                                            borderTop:
                                                "1px solid #edf0f2",
                                            display: "grid",
                                            gridTemplateColumns:
                                                "repeat(3, 1fr)",
                                            gap: "15px",
                                            fontSize: "12px",
                                        }}
                                    >
                                        <div>
                                            <span
                                                style={{
                                                    display: "block",
                                                    color:
                                                        "#8a969f",
                                                    marginBottom:
                                                        "4px",
                                                }}
                                            >
                                                Student
                                            </span>

                                            <strong>
                                                {request.student}
                                            </strong>
                                        </div>

                                        <div>
                                            <span
                                                style={{
                                                    display: "block",
                                                    color:
                                                        "#8a969f",
                                                    marginBottom:
                                                        "4px",
                                                }}
                                            >
                                                Roll No
                                            </span>

                                            <strong>
                                                {request.rollNo ||
                                                    "—"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span
                                                style={{
                                                    display: "block",
                                                    color:
                                                        "#8a969f",
                                                    marginBottom:
                                                        "4px",
                                                }}
                                            >
                                                Email
                                            </span>

                                            <strong>
                                                {request.email ||
                                                    "—"}
                                            </strong>
                                        </div>
                                    </div>

                                    {/* DATE + ACTIONS */}
                                    <div
                                        style={{
                                            marginTop: "15px",
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                            alignItems: "center",
                                            gap: "15px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "11px",
                                                color:
                                                    "#8a969f",
                                            }}
                                        >
                                            Submitted:{" "}
                                            {request.createdAt}
                                        </span>

                                        {request.status ===
                                            "Pending" && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                    }}
                                                >
                                                    <button
                                                        onClick={() =>
                                                            updateStatus(
                                                                request.id,
                                                                "Approved"
                                                            )
                                                        }
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "6px",
                                                            padding:
                                                                "8px 12px",
                                                            border: "none",
                                                            borderRadius:
                                                                "7px",
                                                            background:
                                                                "#18805b",
                                                            color: "#fff",
                                                            fontSize:
                                                                "12px",
                                                            fontWeight:
                                                                "600",
                                                            cursor:
                                                                "pointer",
                                                        }}
                                                    >
                                                        <Check size={14} />
                                                        Approve
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            updateStatus(
                                                                request.id,
                                                                "Rejected"
                                                            )
                                                        }
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "6px",
                                                            padding:
                                                                "8px 12px",
                                                            border: "none",
                                                            borderRadius:
                                                                "7px",
                                                            background:
                                                                "#c0392b",
                                                            color: "#fff",
                                                            fontSize:
                                                                "12px",
                                                            fontWeight:
                                                                "600",
                                                            cursor:
                                                                "pointer",
                                                        }}
                                                    >
                                                        <X size={14} />
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default Requests;