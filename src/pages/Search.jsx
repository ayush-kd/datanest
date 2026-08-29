import API_URL from "../config/api";
import { useState } from "react";
import {
    Search as SearchIcon,
    Zap,
    GitCompare,
} from "lucide-react";

function Search() {
    const [rollNo, setRollNo] =
        useState("");

    const [algorithm, setAlgorithm] =
        useState("linear");

    const [compareResult, setCompareResult] =
        useState(null);

    const [compareLoading, setCompareLoading] =
        useState(false);

    const [result, setResult] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleSearch = async () => {
        if (!rollNo) {
            setError(
                "Please enter a roll number."
            );
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);

            const response =
                await fetch(
                    `${API_URL}/api/search/${algorithm}/${rollNo}`
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Search failed."
                );
            }

            setResult(data);

        } catch (err) {
            console.error(
                "Search error:",
                err
            );

            setError(
                err.message ||
                "Unable to perform search."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = async () => {
        if (!rollNo) {
            setError(
                "Please enter a roll number."
            );
            return;
        }

        try {
            setCompareLoading(true);
            setError("");
            setCompareResult(null);

            const response =
                await fetch(
                    `${API_URL}/api/search/compare/${rollNo}`
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Comparison failed."
                );
            }

            setCompareResult(data);

        } catch (err) {
            console.error(
                "Comparison error:",
                err
            );

            setError(
                err.message ||
                "Unable to compare algorithms."
            );
        } finally {
            setCompareLoading(false);
        }
    };

    return (
        <div className="search-page">

            {/* PAGE HEADER */}
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        DSA ANALYZER
                    </p>

                    <h1>
                        Student Search
                    </h1>

                    <p>
                        Find student records using
                        Linear Search and Binary Search.
                    </p>
                </div>
            </div>

            {/* SEARCH CARD */}
            <section className="search-card">

                <div className="section-header">
                    <div>
                        <h3>
                            Search Student
                        </h3>

                        <p>
                            Choose an algorithm and
                            search by roll number.
                        </p>
                    </div>

                    <div className="search-card-icon">
                        <SearchIcon size={22} />
                    </div>
                </div>

                <div className="search-controls">

                    {/* ROLL NUMBER */}
                    <div className="form-group">
                        <label htmlFor="searchRollNo">
                            Roll Number
                        </label>

                        <input
                            id="searchRollNo"
                            type="number"
                            value={rollNo}
                            onChange={(event) =>
                                setRollNo(
                                    event.target.value
                                )
                            }
                            placeholder="Enter roll number"
                        />
                    </div>

                    {/* ALGORITHM */}
                    <div className="form-group">
                        <label>
                            Search Algorithm
                        </label>

                        <div className="algorithm-selector">

                            <button
                                type="button"
                                className={
                                    algorithm ===
                                        "linear"
                                        ? "algorithm-option active"
                                        : "algorithm-option"
                                }
                                onClick={() =>
                                    setAlgorithm(
                                        "linear"
                                    )
                                }
                            >
                                <SearchIcon
                                    size={18}
                                />

                                <div>
                                    <strong>
                                        Linear Search
                                    </strong>

                                    <span>
                                        O(n)
                                    </span>
                                </div>
                            </button>

                            <button
                                type="button"
                                className={
                                    algorithm ===
                                        "binary"
                                        ? "algorithm-option active"
                                        : "algorithm-option"
                                }
                                onClick={() =>
                                    setAlgorithm(
                                        "binary"
                                    )
                                }
                            >
                                <Zap size={18} />

                                <div>
                                    <strong>
                                        Binary Search
                                    </strong>

                                    <span>
                                        O(log n)
                                    </span>
                                </div>
                            </button>

                        </div>
                    </div>
                    {/* SEARCH ACTIONS */}
                    <div className="search-actions">

                        {/* COMPARE BOTH */}
                        <button
                            type="button"
                            className="secondary-button search-button"
                            onClick={handleCompare}
                            disabled={compareLoading}
                        >
                            <GitCompare size={18} />

                            {compareLoading
                                ? "Comparing..."
                                : "Compare Both"}
                        </button>

                        {/* SEARCH STUDENT */}
                        <button
                            type="button"
                            className="primary-button search-button"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            <SearchIcon size={18} />

                            {loading
                                ? "Searching..."
                                : "Search Student"}
                        </button>

                    </div>


                </div>

                {/* ERROR */}
                {error && (
                    <div className="form-error">
                        {error}
                    </div>
                )}

            </section>

            {/* RESULT */}
            {result && (
                <section className="search-result-card">

                    <div className="section-header">
                        <div>
                            <p className="eyebrow">
                                SEARCH RESULT
                            </p>

                            <h3>
                                {result.found
                                    ? "Student Found"
                                    : "Student Not Found"}
                            </h3>
                        </div>

                        <div className="result-algorithm">
                            {result.algorithm}
                        </div>
                    </div>

                    {result.found ? (
                        <div className="search-result-content">

                            <div className="student-result">

                                <div className="student-avatar large">
                                    {result.student.name
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <h2>
                                        {
                                            result
                                                .student
                                                .name
                                        }
                                    </h2>

                                    <p>
                                        Roll #
                                        {
                                            result
                                                .student
                                                .rollNo
                                        }
                                    </p>
                                </div>

                            </div>

                            <div className="result-details">

                                <div>
                                    <span>
                                        Department
                                    </span>

                                    <strong>
                                        {
                                            result
                                                .student
                                                .department
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Year
                                    </span>

                                    <strong>
                                        {
                                            result
                                                .student
                                                .year
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        CGPA
                                    </span>

                                    <strong>
                                        {
                                            result
                                                .student
                                                .cgpa
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Status
                                    </span>

                                    <strong>
                                        {
                                            result
                                                .student
                                                .status
                                        }
                                    </strong>
                                </div>

                            </div>

                        </div>
                    ) : (
                        <div className="empty-state">
                            No student found with
                            roll number{" "}
                            <strong>
                                {rollNo}
                            </strong>
                        </div>
                    )}

                    {/* ALGORITHM ANALYSIS */}
                    <div className="search-analysis">

                        <div className="analysis-item">
                            <span>
                                Algorithm
                            </span>

                            <strong>
                                {result.algorithm}
                            </strong>
                        </div>

                        <div className="analysis-item">
                            <span>
                                Comparisons
                            </span>

                            <strong>
                                {result.comparisons}
                            </strong>
                        </div>

                        <div className="analysis-item">
                            <span>
                                Time Complexity
                            </span>

                            <strong>
                                {
                                    result.timeComplexity
                                }
                            </strong>
                        </div>

                        <div className="analysis-item">
                            <span>
                                Space Complexity
                            </span>

                            <strong>
                                O(1)
                            </strong>
                        </div>

                    </div>

                </section>
            )}

            {compareResult && (
                <section className="search-result-card">

                    <div className="section-header">
                        <div>
                            <p className="eyebrow">
                                ALGORITHM COMPARISON
                            </p>

                            <h3>
                                Search Performance
                            </h3>

                            <p>
                                Comparing Linear Search
                                and Binary Search for
                                roll #{compareResult.rollNo}
                            </p>
                        </div>

                        <div className="result-algorithm">
                            Compare Both
                        </div>
                    </div>

                    <div className="comparison-grid">

                        {/* LINEAR SEARCH */}
                        <div className="comparison-card">

                            <div className="comparison-card-header">
                                <SearchIcon size={20} />

                                <div>
                                    <h4>
                                        Linear Search
                                    </h4>

                                    <span>
                                        O(n)
                                    </span>
                                </div>
                            </div>

                            <div className="comparison-metric">
                                <span>
                                    Result
                                </span>

                                <strong>
                                    {compareResult
                                        .linearSearch
                                        .found
                                        ? "Found"
                                        : "Not Found"}
                                </strong>
                            </div>

                            <div className="comparison-metric">
                                <span>
                                    Comparisons
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .linearSearch
                                            .comparisons
                                    }
                                </strong>
                            </div>

                            <div className="comparison-metric">
                                <span>
                                    Time Complexity
                                </span>

                                <strong>
                                    O(n)
                                </strong>
                            </div>

                            <div className="comparison-metric">
                                <span>
                                    Space Complexity
                                </span>

                                <strong>
                                    O(1)
                                </strong>
                            </div>

                        </div>


                        {/* BINARY SEARCH */}
                        <div className="comparison-card">

                            <div className="comparison-card-header">
                                <Zap size={20} />

                                <div>
                                    <h4>
                                        Binary Search
                                    </h4>

                                    <span>
                                        O(log n)
                                    </span>
                                </div>
                            </div>

                            <div className="comparison-metric">
                                <span>
                                    Result
                                </span>

                                <strong>
                                    {compareResult
                                        .binarySearch
                                        .found
                                        ? "Found"
                                        : "Not Found"}
                                </strong>
                            </div>

                            <div className="comparison-metric">
                                <span>
                                    Comparisons
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .binarySearch
                                            .comparisons
                                    }
                                </strong>
                            </div>

                            <div className="comparison-metric">
                                <span>
                                    Time Complexity
                                </span>

                                <strong>
                                    O(log n)
                                </strong>
                            </div>

                            <div className="comparison-metric">
                                <span>
                                    Space Complexity
                                </span>

                                <strong>
                                    O(1)
                                </strong>
                            </div>

                        </div>

                    </div>

                    <div className="comparison-summary">

                        <GitCompare size={20} />

                        <div>
                            <strong>
                                Comparison Difference
                            </strong>

                            <p>
                                Linear Search used{" "}
                                {
                                    compareResult
                                        .linearSearch
                                        .comparisons
                                }{" "}
                                comparisons, while Binary
                                Search used{" "}
                                {
                                    compareResult
                                        .binarySearch
                                        .comparisons
                                }{" "}
                                comparisons.
                            </p>
                        </div>

                    </div>

                </section>
            )}

        </div>
    );
}

export default Search;