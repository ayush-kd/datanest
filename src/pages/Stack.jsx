import API_URL from "../config/api";
import { useState } from "react";
import {
    Layers,
    Undo2,
    Redo2,
    User,
    CheckCircle2,
} from "lucide-react";

function Stack() {
    const [result, setResult] = useState(null);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    // =====================================
    // UNDO
    // =====================================

    const handleUndo = async () => {
        try {
            setLoading(true);
            setError("");
            setResult(null);

            const response = await fetch(
                `${API_URL}/api/undo`,
                {
                    method: "POST",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to undo operation."
                );
            }

            setResult({
                success: true,
                message: data.message,
                dataStructure: "Stack",
                principle: "LIFO",
                undone: true,
                operation: data.operation,
                rollNo: data.rollNo,
                studentName: data.studentName,
            });

        } catch (err) {
            console.error("Undo error:", err);

            setError(
                err.message ||
                "Unable to undo operation."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================
    // REDO
    // =====================================

    const handleRedo = async () => {
        try {
            setLoading(true);
            setError("");
            setResult(null);

            const response = await fetch(
                `${API_URL}/api/redo`,
                {
                    method: "POST",
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to redo operation."
                );
            }

            setResult({
                success: true,
                message: data.message,
                dataStructure: "Stack",
                principle: "LIFO",
                redone: true,
                operation: data.operation,
                rollNo: data.rollNo,
                studentName: data.studentName,
            });

        } catch (err) {
            console.error("Redo error:", err);

            setError(
                err.message ||
                "Unable to redo operation."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sorting-page">

            {/* =====================================
                PAGE HEADER
            ===================================== */}

            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        DSA LAB
                    </p>

                    <h1>
                        Undo / Stack
                    </h1>

                    <p>
                        Demonstrate LIFO using a
                        stack-based undo system.
                    </p>
                </div>
            </div>


            {/* =====================================
                STACK OPERATIONS
            ===================================== */}

            <section className="search-card stack-operation-card">

                <div className="section-header">

                    <div>
                        <p className="eyebrow">
                            STACK
                        </p>

                        <h3>
                            Stack Operations
                        </h3>

                        <p>
                            Last In, First Out
                            (LIFO)
                        </p>
                    </div>

                    <div className="search-card-icon">
                        <Layers size={22} />
                    </div>

                </div>


                <div className="stack-principle">

                    <div className="stack-principle-icon">
                        <Layers size={20} />
                    </div>

                    <div>
                        <strong>
                            LIFO Principle
                        </strong>

                        <span>
                            The last operation added to
                            the stack is the first one
                            removed.
                        </span>
                    </div>

                </div>


                <div className="search-actions">

                    <button
                        type="button"
                        className="primary-button"
                        onClick={handleUndo}
                        disabled={loading}
                    >
                        <Undo2 size={18} />

                        {loading
                            ? "Processing..."
                            : "Undo Last Operation"}
                    </button>


                    <button
                        type="button"
                        onClick={handleRedo}
                        disabled={loading}
                    >
                        <Redo2 size={18} />

                        {loading
                            ? "Processing..."
                            : "Redo"}
                    </button>

                </div>


                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

            </section>


            {/* =====================================
                RESULT
            ===================================== */}

            {result && (
                <section className="search-result-card stack-result-card">

                    {/* RESULT HEADER */}

                    <div className="section-header">

                        <div>

                            <p className="eyebrow">
                                STACK RESULT
                            </p>

                            <h3>
                                {result.redone
                                    ? "Redo Completed"
                                    : "Undo Completed"}
                            </h3>

                            <p>
                                The stack operation was
                                successfully processed.
                            </p>

                        </div>

                        <div className="result-algorithm">
                            <Layers size={15} />
                            Stack
                        </div>

                    </div>


                    {/* BASIC INFORMATION */}

                    <div className="search-analysis">

                        <div className="analysis-item">
                            <span>
                                Data Structure
                            </span>

                            <strong>
                                Stack
                            </strong>
                        </div>


                        <div className="analysis-item">
                            <span>
                                Principle
                            </span>

                            <strong>
                                LIFO
                            </strong>
                        </div>


                        <div className="analysis-item">
                            <span>
                                Operation
                            </span>

                            <strong>
                                {result.operation}
                            </strong>
                        </div>


                        <div className="analysis-item">
                            <span>
                                Status
                            </span>

                            <strong className="success-text">
                                {result.redone
                                    ? "Redone"
                                    : "Undone"}
                            </strong>
                        </div>

                    </div>


                    {/* STUDENT */}

                    <div className="stack-student-card">

                        <div className="stack-student-icon">
                            <User size={20} />
                        </div>

                        <div className="stack-student-info">

                            <span>
                                STUDENT
                            </span>

                            <strong>
                                {result.studentName}
                            </strong>

                            <p>
                                Roll No: #
                                {result.rollNo}
                            </p>

                        </div>

                    </div>


                    {/* OPERATION VISUALIZATION */}

                    <div className="stack-flow">

                        <div className="stack-flow-item">

                            <div className="stack-flow-icon">
                                <Layers size={19} />
                            </div>

                            <div>
                                <span>
                                    OPERATION
                                </span>

                                <strong>
                                    {result.operation}
                                </strong>
                            </div>

                        </div>


                        <div className="stack-flow-arrow">
                            →
                        </div>


                        <div className="stack-flow-item">

                            <div className="stack-flow-icon">
                                {result.redone
                                    ? <Redo2 size={19} />
                                    : <Undo2 size={19} />}
                            </div>

                            <div>
                                <span>
                                    ACTION
                                </span>

                                <strong>
                                    {result.redone
                                        ? "Redo"
                                        : "Undo"}
                                </strong>
                            </div>

                        </div>


                        <div className="stack-flow-arrow">
                            →
                        </div>


                        <div className="stack-flow-item">

                            <div className="stack-flow-icon">
                                <CheckCircle2 size={19} />
                            </div>

                            <div>
                                <span>
                                    RESULT
                                </span>

                                <strong>
                                    Successful
                                </strong>
                            </div>

                        </div>

                    </div>


                    {/* SUMMARY */}

                    <div className="comparison-summary">

                        <CheckCircle2 size={20} />

                        <div>

                            <strong>
                                {result.redone
                                    ? "Redo Completed"
                                    : "Undo Completed"}
                            </strong>

                            <p>
                                <strong>
                                    {result.operation}
                                </strong>{" "}
                                operation was{" "}
                                {result.redone
                                    ? "redone"
                                    : "undone"}{" "}
                                for{" "}
                                <strong>
                                    {result.studentName}
                                </strong>{" "}
                                (Roll No: #
                                <strong>
                                    {result.rollNo}
                                </strong>
                                ).
                            </p>

                        </div>

                    </div>

                </section>
            )}

        </div>
    );
}

export default Stack;