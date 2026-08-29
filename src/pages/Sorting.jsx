import API_URL from "../config/api";
import { useState } from "react";
import {
    ArrowDownUp,
    GitCompare,
    ListOrdered,
    Zap,
} from "lucide-react";

function Sorting() {
    const [algorithm, setAlgorithm] =
        useState("insertion");

    const [result, setResult] =
        useState(null);

    const [compareResult, setCompareResult] =
        useState(null);

    const [compareLoading, setCompareLoading] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleSort = async () => {
        try {
            setLoading(true);
            setError("");
            setResult(null);

            const response =
                await fetch(
                    `${API_URL}/api/sort/${algorithm}`
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Sorting failed."
                );
            }

            setResult(data);

        } catch (err) {
            console.error(
                "Sorting error:",
                err
            );

            setError(
                err.message ||
                "Unable to perform sorting."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCompare = async () => {
        try {
            setCompareLoading(true);
            setError("");
            setCompareResult(null);

            const response =
                await fetch(
                    `${API_URL}/api/sort/compare`
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Sort comparison failed."
                );
            }

            setCompareResult(data);

        } catch (err) {
            console.error(
                "Sort comparison error:",
                err
            );

            setError(
                err.message ||
                "Unable to compare sorting algorithms."
            );
        } finally {
            setCompareLoading(false);
        }
    };

    return (
        <div className="sorting-page">

            {/* HEADER */}
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        DSA LAB
                    </p>

                    <h1>
                        Student Sorting
                    </h1>

                    <p>
                        Organize student records
                        using classic sorting algorithms.
                    </p>
                </div>
            </div>


            {/* CONTROL CARD */}
            <section className="search-card">

                <div className="section-header">
                    <div>
                        <h3>
                            Sorting Algorithm
                        </h3>

                        <p>
                            Choose an algorithm to
                            sort students by CGPA.
                        </p>
                    </div>

                    <div className="search-card-icon">
                        <ArrowDownUp size={22} />
                    </div>
                </div>


                {/* ALGORITHM OPTIONS */}
                <div className="algorithm-selector">

                    <button
                        type="button"
                        className={
                            algorithm ===
                                "insertion"
                                ? "algorithm-option active"
                                : "algorithm-option"
                        }
                        onClick={() =>
                            setAlgorithm(
                                "insertion"
                            )
                        }
                    >
                        <ListOrdered
                            size={20}
                        />

                        <div>
                            <strong>
                                Insertion Sort
                            </strong>

                            <span>
                                O(n²)
                            </span>
                        </div>
                    </button>


                    <button
                        type="button"
                        className={
                            algorithm ===
                                "merge"
                                ? "algorithm-option active"
                                : "algorithm-option"
                        }
                        onClick={() =>
                            setAlgorithm(
                                "merge"
                            )
                        }
                    >
                        <Zap size={20} />

                        <div>
                            <strong>
                                Merge Sort
                            </strong>

                            <span>
                                O(n log n)
                            </span>
                        </div>
                    </button>

                </div>


                {/* ACTIONS */}
                <div className="search-actions">

                    <button
                        type="button"
                        className="primary-button"
                        onClick={handleSort}
                        disabled={loading}
                    >
                        <ArrowDownUp size={18} />

                        {loading
                            ? "Sorting..."
                            : "Sort Students"}
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleCompare}
                        disabled={compareLoading}
                    >
                        <GitCompare size={18} />

                        {compareLoading
                            ? "Comparing..."
                            : "Compare Both"}
                    </button>

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
                                SORT RESULT
                            </p>

                            <h3>
                                {
                                    result.algorithm
                                }
                            </h3>

                            <p>
                                Students sorted by
                                CGPA in ascending order.
                            </p>
                        </div>

                        <div className="result-algorithm">
                            {
                                result.algorithm
                            }
                        </div>

                    </div>


                    {/* ANALYSIS */}
                    <div className="search-analysis">

                        <div className="analysis-item">
                            <span>
                                Comparisons
                            </span>

                            <strong>
                                {
                                    result.comparisons
                                }
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
                                {
                                    result.spaceComplexity
                                }
                            </strong>
                        </div>

                        <div className="analysis-item">
                            <span>
                                Records Sorted
                            </span>

                            <strong>
                                {
                                    result.students
                                        .length
                                }
                            </strong>
                        </div>

                    </div>


                    {/* SORTED TABLE */}
                    <div className="table-wrapper">

                        <table className="student-table">

                            <thead>
                                <tr>
                                    <th>
                                        #
                                    </th>

                                    <th>
                                        Student
                                    </th>

                                    <th>
                                        Roll No
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Year
                                    </th>

                                    <th>
                                        CGPA
                                    </th>

                                    <th>
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody>

                                {result.students.map(
                                    (
                                        student,
                                        index
                                    ) => (
                                        <tr
                                            key={
                                                student.rollNo
                                            }
                                        >

                                            <td>
                                                {
                                                    index +
                                                    1
                                                }
                                            </td>

                                            <td>
                                                <div className="student-cell">

                                                    <div className="student-avatar">
                                                        {
                                                            student.name
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()
                                                        }
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                student.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                student.email
                                                            }
                                                        </span>
                                                    </div>

                                                </div>
                                            </td>

                                            <td>
                                                #
                                                {
                                                    student.rollNo
                                                }
                                            </td>

                                            <td>
                                                {
                                                    student.department
                                                }
                                            </td>

                                            <td>
                                                {
                                                    student.year
                                                }
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        student.cgpa
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="status-badge">
                                                    {
                                                        student.status
                                                    }
                                                </span>
                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </section>
            )}

            {compareResult && (
                <section className="search-result-card">

                    <div className="section-header">

                        <div>
                            <p className="eyebrow">
                                SORT COMPARISON
                            </p>

                            <h3>
                                Insertion Sort vs Merge Sort
                            </h3>

                            <p>
                                Comparing both algorithms
                                using the current student records.
                            </p>
                        </div>

                        <div className="result-algorithm">
                            Compare Both
                        </div>

                    </div>


                    {/* COMPARISON CARDS */}
                    <div className="comparison-grid">

                        {/* INSERTION SORT */}
                        <div className="comparison-card">

                            <div className="comparison-card-header">

                                <ListOrdered size={20} />

                                <div>
                                    <h4>
                                        Insertion Sort
                                    </h4>

                                    <span>
                                        O(n²)
                                    </span>
                                </div>

                            </div>


                            <div className="comparison-metric">
                                <span>
                                    Comparisons
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .insertionSort
                                            .comparisons
                                    }
                                </strong>
                            </div>


                            <div className="comparison-metric">
                                <span>
                                    Time Complexity
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .insertionSort
                                            .timeComplexity
                                    }
                                </strong>
                            </div>


                            <div className="comparison-metric">
                                <span>
                                    Space Complexity
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .insertionSort
                                            .spaceComplexity
                                    }
                                </strong>
                            </div>


                            <div className="comparison-metric">
                                <span>
                                    Records
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .insertionSort
                                            .students
                                            .length
                                    }
                                </strong>
                            </div>

                        </div>


                        {/* MERGE SORT */}
                        <div className="comparison-card">

                            <div className="comparison-card-header">

                                <Zap size={20} />

                                <div>
                                    <h4>
                                        Merge Sort
                                    </h4>

                                    <span>
                                        O(n log n)
                                    </span>
                                </div>

                            </div>


                            <div className="comparison-metric">
                                <span>
                                    Comparisons
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .mergeSort
                                            .comparisons
                                    }
                                </strong>
                            </div>


                            <div className="comparison-metric">
                                <span>
                                    Time Complexity
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .mergeSort
                                            .timeComplexity
                                    }
                                </strong>
                            </div>


                            <div className="comparison-metric">
                                <span>
                                    Space Complexity
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .mergeSort
                                            .spaceComplexity
                                    }
                                </strong>
                            </div>


                            <div className="comparison-metric">
                                <span>
                                    Records
                                </span>

                                <strong>
                                    {
                                        compareResult
                                            .mergeSort
                                            .students
                                            .length
                                    }
                                </strong>
                            </div>

                        </div>

                    </div>


                    {/* SUMMARY */}
                    <div className="comparison-summary">

                        <GitCompare size={20} />

                        <div>

                            <strong>
                                Comparison Difference
                            </strong>

                            <p>
                                The difference in comparison
                                count is{" "}
                                <strong>
                                    {
                                        compareResult
                                            .comparisonDifference
                                    }
                                </strong>.
                            </p>

                        </div>

                    </div>

                </section>
            )}

        </div>
    );
}

export default Sorting;