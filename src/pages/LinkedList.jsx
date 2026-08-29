import API_URL from "../config/api";
import React, { useState } from "react";
import {
    GitBranch,
    CircleArrowRight,
    ArrowLeftRight,
} from "lucide-react";

function LinkedList() {
    const [result, setResult] =
        useState(null);

    const [doublyResult, setDoublyResult] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleLinkedListTest =
        async () => {
            try {
                setLoading(true);
                setError("");
                setResult(null);
                setDoublyResult(null);

                const [
                    singlyResponse,
                    doublyResponse,
                ] = await Promise.all([
                    fetch(
                        `${API_URL}/api/linked-list/test`
                    ),

                    fetch(
                        `${API_URL}/api/doubly-linked-list/test`
                    ),
                ]);

                const singlyData =
                    await singlyResponse.json();

                const doublyData =
                    await doublyResponse.json();

                if (
                    !singlyResponse.ok ||
                    !singlyData.success
                ) {
                    throw new Error(
                        singlyData.message ||
                        "Singly Linked List operation failed."
                    );
                }

                if (
                    !doublyResponse.ok ||
                    !doublyData.success
                ) {
                    throw new Error(
                        doublyData.message ||
                        "Doubly Linked List operation failed."
                    );
                }

                setResult(singlyData);
                setDoublyResult(doublyData);

            } catch (err) {
                console.error(
                    "Linked List error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to test linked lists."
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <div className="sorting-page">

            <div className="page-heading">

                <div>

                    <p className="eyebrow">
                        DSA LAB
                    </p>

                    <h1>
                        Linked List
                    </h1>

                    <p>
                        Compare singly and doubly linked
                        lists with forward and backward
                        traversal.
                    </p>

                </div>

            </div>


            <section className="search-card">

                <div className="section-header">

                    <div>

                        <h3>
                            Linked List Operations
                        </h3>

                        <p>
                            Nodes connected through
                            next pointers.
                        </p>

                    </div>

                    <div className="search-card-icon">

                        <GitBranch
                            size={22}
                        />

                    </div>

                </div>


                <div className="search-actions">

                    <button
                        type="button"
                        className="primary-button"
                        onClick={
                            handleLinkedListTest
                        }
                        disabled={loading}
                    >

                        <GitBranch
                            size={18}
                        />

                        {loading
                            ? "Processing..."
                            : "Run Linked List Test"}

                    </button>

                </div>


                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

            </section>


            {result && doublyResult && (
                <section className="search-result-card">

                    <div className="section-header">

                        <div>

                            <p className="eyebrow">
                                LINKED LIST RESULT
                            </p>

                            <h3>
                                Singly vs Doubly Linked List
                            </h3>

                        </div>

                        <div className="result-algorithm">
                            DSA Comparison
                        </div>

                    </div>


                    {/* ================================
            SINGLY + DOUBLY SUMMARY
        ================================= */}

                    <div className="comparison-grid">

                        {/* SINGLY */}

                        <div className="comparison-card">

                            <div className="comparison-card-header">

                                <GitBranch size={20} />

                                <div>

                                    <h4>
                                        Singly Linked List
                                    </h4>

                                    <span>
                                        One-way links
                                    </span>

                                </div>

                            </div>


                            <div className="comparison-metric">

                                <span>
                                    Size
                                </span>

                                <strong>
                                    {result.size}
                                </strong>

                            </div>


                            <div className="comparison-metric">

                                <span>
                                    Head
                                </span>

                                <strong>
                                    #{result.head.rollNo}
                                </strong>

                            </div>


                            <div className="comparison-metric">

                                <span>
                                    Tail
                                </span>

                                <strong>
                                    #{result.tail.rollNo}
                                </strong>

                            </div>

                        </div>


                        {/* DOUBLY */}

                        <div className="comparison-card">

                            <div className="comparison-card-header">

                                <ArrowLeftRight size={20} />

                                <div>

                                    <h4>
                                        Doubly Linked List
                                    </h4>

                                    <span>
                                        Two-way links
                                    </span>

                                </div>

                            </div>


                            <div className="comparison-metric">

                                <span>
                                    Size
                                </span>

                                <strong>
                                    {doublyResult.size}
                                </strong>

                            </div>


                            <div className="comparison-metric">

                                <span>
                                    Head
                                </span>

                                <strong>
                                    #{doublyResult.head.rollNo}
                                </strong>

                            </div>


                            <div className="comparison-metric">

                                <span>
                                    Tail
                                </span>

                                <strong>
                                    #{doublyResult.tail.rollNo}
                                </strong>

                            </div>

                        </div>

                    </div>


                    {/* ================================
            SINGLY STRUCTURE
        ================================= */}

                    <div className="comparison-summary">
                        <GitBranch size={20} />

                        <div style={{ width: "100%" }}>
                            <strong>Singly Linked List</strong>

                            <p style={{ marginBottom: "12px" }}>
                                Head → next pointer → next pointer → NULL
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    overflowX: "auto",
                                    padding: "15px 5px",
                                }}
                            >
                                <span style={{ fontWeight: "700" }}>
                                    HEAD →
                                </span>

                                {result.nodes.map((node, index) => (
                                    <React.Fragment key={node.rollNo}>

                                        <div
                                            style={{
                                                minWidth: "145px",
                                                padding: "14px",
                                                border: "2px solid #18a6a6",
                                                borderRadius: "12px",
                                                background: "#f4ffff",
                                                textAlign: "center",
                                            }}
                                        >
                                            <strong>
                                                #{node.rollNo}
                                            </strong>

                                            <div style={{ marginTop: "6px" }}>
                                                {node.name}
                                            </div>

                                            <small>
                                                data
                                            </small>

                                            <div
                                                style={{
                                                    marginTop: "8px",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                next →
                                            </div>
                                        </div>

                                        {index < result.nodes.length - 1 && (
                                            <span
                                                style={{
                                                    fontSize: "24px",
                                                    fontWeight: "700",
                                                }}
                                            >
                                                →
                                            </span>
                                        )}

                                    </React.Fragment>
                                ))}

                                <span style={{ fontWeight: "700" }}>
                                    NULL
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ================================
            DOUBLY FORWARD
        ================================= */}

                    <div className="comparison-summary">
                        <ArrowLeftRight size={20} />

                        <div style={{ width: "100%" }}>
                            <strong>
                                Doubly Linked List — Forward
                            </strong>

                            <p style={{ marginBottom: "12px" }}>
                                Each node has both prev and next pointers.
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    overflowX: "auto",
                                    padding: "15px 5px",
                                }}
                            >
                                <span style={{ fontWeight: "700" }}>
                                    NULL
                                </span>

                                <span>←</span>

                                {doublyResult.forward.map((node, index) => (
                                    <React.Fragment key={node.rollNo}>

                                        <div
                                            style={{
                                                minWidth: "150px",
                                                padding: "14px",
                                                border: "2px solid #18a6a6",
                                                borderRadius: "12px",
                                                background: "#f4ffff",
                                                textAlign: "center",
                                            }}
                                        >
                                            <strong>
                                                #{node.rollNo}
                                            </strong>

                                            <div style={{ marginTop: "6px" }}>
                                                {node.name}
                                            </div>

                                            <small>
                                                prev | data | next
                                            </small>
                                        </div>

                                        {index <
                                            doublyResult.forward.length - 1 && (
                                                <span
                                                    style={{
                                                        fontSize: "22px",
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    ⇄
                                                </span>
                                            )}

                                    </React.Fragment>
                                ))}

                                <span>→</span>

                                <span style={{ fontWeight: "700" }}>
                                    NULL
                                </span>
                            </div>
                        </div>
                    </div>


                    {/* ================================
            DOUBLY BACKWARD
        ================================= */}

                    <div className="comparison-summary">
                        <ArrowLeftRight size={20} />

                        <div style={{ width: "100%" }}>
                            <strong>
                                Doubly Linked List — Backward
                            </strong>

                            <p style={{ marginBottom: "12px" }}>
                                Tail → prev → prev → HEAD
                            </p>

                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    overflowX: "auto",
                                    padding: "15px 5px",
                                }}
                            >
                                <span style={{ fontWeight: "700" }}>
                                    TAIL →
                                </span>

                                {doublyResult.backward.map((node, index) => (
                                    <React.Fragment key={node.rollNo}>

                                        <div
                                            style={{
                                                minWidth: "150px",
                                                padding: "14px",
                                                border: "2px solid #18a6a6",
                                                borderRadius: "12px",
                                                background: "#f4ffff",
                                                textAlign: "center",
                                            }}
                                        >
                                            <strong>
                                                #{node.rollNo}
                                            </strong>

                                            <div style={{ marginTop: "6px" }}>
                                                {node.name}
                                            </div>

                                            <small>
                                                prev ←
                                            </small>
                                        </div>

                                        {index <
                                            doublyResult.backward.length - 1 && (
                                                <span
                                                    style={{
                                                        fontSize: "22px",
                                                        fontWeight: "700",
                                                    }}
                                                >
                                                    ⇄
                                                </span>
                                            )}

                                    </React.Fragment>
                                ))}

                                <span style={{ fontWeight: "700" }}>
                                    HEAD
                                </span>
                            </div>
                        </div>
                    </div>


                    {/* ================================
            NODE CARDS
        ================================= */}

                    <div className="comparison-grid">

                        <div className="comparison-card">

                            <div className="comparison-card-header">

                                <GitBranch size={20} />

                                <div>

                                    <h4>
                                        Singly Structure
                                    </h4>

                                    <span>
                                        next pointer
                                    </span>

                                </div>

                            </div>

                            <p>
                                Each node points only to
                                the next node.
                            </p>

                        </div>


                        <div className="comparison-card">

                            <div className="comparison-card-header">

                                <ArrowLeftRight size={20} />

                                <div>

                                    <h4>
                                        Doubly Structure
                                    </h4>

                                    <span>
                                        prev + next pointers
                                    </span>

                                </div>

                            </div>

                            <p>
                                Each node can move both
                                forward and backward.
                            </p>

                        </div>

                    </div>


                    {/* ================================
            COMPARISON SUMMARY
        ================================= */}

                    <div className="comparison-summary">

                        <ArrowLeftRight size={20} />

                        <div>

                            <strong>
                                Linked List Comparison
                            </strong>

                            <p>
                                Singly Linked List supports
                                forward traversal using a
                                <strong> next </strong>
                                pointer, while Doubly Linked
                                List supports both
                                <strong> forward </strong>
                                and
                                <strong> backward </strong>
                                traversal using
                                <strong> prev </strong>
                                and
                                <strong> next </strong>
                                pointers.
                            </p>

                        </div>

                    </div>

                </section>
            )}

        </div>
    );
}

export default LinkedList;