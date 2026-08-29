import API_URL from "../config/api";
import { useState } from "react";
import {
    ListOrdered,
    ArrowDownToLine,
    CheckCircle2,
    ArrowRight,
} from "lucide-react";

function Queue() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleQueueTest = async () => {
        try {
            setLoading(true);
            setError("");
            setResult(null);

            const response = await fetch(
                `${API_URL}/api/queue/test`
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Queue operation failed."
                );
            }

            setResult(data);
        } catch (err) {
            console.error("Queue error:", err);

            setError(
                err.message ||
                "Unable to perform queue operation."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="queue-page">

            {/* =================================
                PAGE HEADER
            ================================= */}

            <div className="page-heading queue-heading">
                <div>
                    <p className="eyebrow">
                        DSA LAB
                    </p>

                    <h1>Queue</h1>

                    <p>
                        Demonstrate First In, First Out
                        using a queue.
                    </p>
                </div>
            </div>


            {/* =================================
                QUEUE OPERATION CARD
            ================================= */}

            <section className="queue-operation-card">

                <div className="queue-operation-top">

                    <div className="queue-title-area">

                        <div className="queue-icon-box">
                            <ListOrdered size={22} />
                        </div>

                        <div>
                            <p className="eyebrow">
                                DATA STRUCTURE
                            </p>

                            <h2>
                                Queue Operations
                            </h2>

                            <p>
                                First In, First Out
                                <span className="fifo-label">
                                    FIFO
                                </span>
                            </p>
                        </div>

                    </div>

                </div>


                <div className="queue-operation-bottom">

                    <div className="queue-explanation">
                        <strong>
                            How it works
                        </strong>

                        <span>
                            The first student entering
                            the queue is removed first.
                        </span>
                    </div>

                    <button
                        type="button"
                        className="primary-button queue-run-button"
                        onClick={handleQueueTest}
                        disabled={loading}
                    >
                        <ArrowDownToLine size={18} />

                        {loading
                            ? "Processing..."
                            : "Run Queue Test"}
                    </button>

                </div>


                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

            </section>


            {/* =================================
                RESULT
            ================================= */}

            {result && (
                <section className="queue-result-card">

                    {/* RESULT HEADER */}

                    <div className="queue-result-header">

                        <div>
                            <p className="eyebrow">
                                QUEUE RESULT
                            </p>

                            <h2>
                                FIFO Operation Successful
                            </h2>

                            <p>
                                The queue removed the first
                                item that entered.
                            </p>
                        </div>

                        <div className="queue-success-badge">
                            <CheckCircle2 size={16} />
                            FIFO
                        </div>

                    </div>


                    {/* =================================
                        SUMMARY CARDS
                    ================================= */}

                    <div className="queue-stats">

                        <div className="queue-stat">
                            <span>
                                DATA STRUCTURE
                            </span>

                            <strong>
                                {result.dataStructure}
                            </strong>
                        </div>

                        <div className="queue-stat">
                            <span>
                                PRINCIPLE
                            </span>

                            <strong>
                                {result.principle}
                            </strong>
                        </div>

                        <div className="queue-stat">
                            <span>
                                INITIAL SIZE
                            </span>

                            <strong>
                                {result.initialSize}
                            </strong>
                        </div>

                        <div className="queue-stat">
                            <span>
                                FINAL SIZE
                            </span>

                            <strong>
                                {result.finalSize}
                            </strong>
                        </div>

                    </div>


                    {/* =================================
                        QUEUE VISUALIZATION
                    ================================= */}

                    <div className="queue-visual-section">

                        <div className="queue-section-title">

                            <div>
                                <p className="eyebrow">
                                    QUEUE FLOW
                                </p>

                                <h3>
                                    First In → First Out
                                </h3>
                            </div>

                            <span>
                                {result.initialSize} items
                            </span>

                        </div>


                        <div className="queue-flow">

                            {/* FRONT */}

                            <div className="queue-flow-label">
                                FRONT
                                <ArrowRight size={16} />
                            </div>


                            {/* FIRST ITEM */}

                            <div className="queue-item queue-item-front">

                                <div className="queue-item-number">
                                    01
                                </div>

                                <div className="queue-item-content">

                                    <span>
                                        First Item
                                    </span>

                                    <strong>
                                        #{result.frontRollNo}
                                    </strong>

                                    <small>
                                        {result.frontStudent}
                                    </small>

                                </div>

                            </div>


                            <div className="queue-arrow">
                                <ArrowRight size={20} />
                            </div>


                            {/* REMAINING ITEMS */}

                            <div className="queue-item queue-item-muted">

                                <div className="queue-item-number">
                                    02
                                </div>

                                <div className="queue-item-content">

                                    <span>
                                        Waiting
                                    </span>

                                    <strong>
                                        Remaining
                                    </strong>

                                    <small>
                                        {Math.max(
                                            result.initialSize - 1,
                                            0
                                        )} items
                                    </small>

                                </div>

                            </div>


                            <div className="queue-arrow">
                                <ArrowRight size={20} />
                            </div>


                            <div className="queue-item queue-item-muted">

                                <div className="queue-item-number">
                                    03
                                </div>

                                <div className="queue-item-content">

                                    <span>
                                        Waiting
                                    </span>

                                    <strong>
                                        Queue
                                    </strong>

                                    <small>
                                        FIFO order
                                    </small>

                                </div>

                            </div>

                        </div>


                        {/* DEQUEUE ACTION */}

                        <div className="dequeue-flow">

                            <div className="dequeue-line"></div>

                            <div className="dequeue-box">

                                <ArrowDownToLine size={20} />

                                <div>
                                    <span>
                                        DEQUEUE
                                    </span>

                                    <strong>
                                        #{result.dequeuedRollNo}
                                    </strong>
                                </div>

                                <div className="dequeue-student">
                                    {result.dequeuedStudent}
                                </div>

                                <span className="removed-label">
                                    Removed first
                                </span>

                            </div>

                        </div>

                    </div>


                    {/* =================================
                        BEFORE / AFTER
                    ================================= */}

                    <div className="queue-before-after">

                        <div className="before-after-card">

                            <span>
                                BEFORE DEQUEUE
                            </span>

                            <strong>
                                {result.initialSize}
                            </strong>

                            <small>
                                items in queue
                            </small>

                        </div>


                        <div className="before-after-arrow">
                            <ArrowRight size={20} />
                        </div>


                        <div className="before-after-card after">

                            <span>
                                AFTER DEQUEUE
                            </span>

                            <strong>
                                {result.finalSize}
                            </strong>

                            <small>
                                items remaining
                            </small>

                        </div>

                    </div>


                    {/* =================================
                        FIFO VERIFIED
                    ================================= */}

                    <div className="fifo-verified">

                        <div className="fifo-check">
                            <CheckCircle2 size={21} />
                        </div>

                        <div>

                            <strong>
                                FIFO Verified
                            </strong>

                            <p>
                                <strong>
                                    {result.dequeuedStudent}
                                </strong>{" "}
                                entered the queue first,
                                so it was the first student
                                removed.
                            </p>

                        </div>

                    </div>

                </section>
            )}

        </div>
    );
}

export default Queue;