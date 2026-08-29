import React, { useState } from "react";

const linearSearchCode = `Student *linearSearch(
    int rollNo,
    int &comparisons)
{
    comparisons = 0;

    Student *current = head;

    while (current != nullptr)
    {
        comparisons++;

        if (current->rollNo == rollNo)
        {
            return current;
        }

        current = current->next;
    }

    return nullptr;
}`;

const binarySearchCode = `Student *binarySearch(
    int rollNo,
    int &comparisons)
{
    comparisons = 0;

    vector<Student *> records;

    Student *current = head;

    while (current != nullptr)
    {
        records.push_back(current);
        current = current->next;
    }

    sort(
        records.begin(),
        records.end(),
        [](Student *a, Student *b)
        {
            return a->rollNo < b->rollNo;
        });

    int left = 0;
    int right =
        static_cast<int>(records.size()) - 1;

    while (left <= right)
    {
        int middle =
            left + (right - left) / 2;

        comparisons++;

        if (
            records[middle]->rollNo ==
            rollNo)
        {
            return records[middle];
        }

        if (
            records[middle]->rollNo <
            rollNo)
        {
            left = middle + 1;
        }
        else
        {
            right = middle - 1;
        }
    }

    return nullptr;
}`;

const insertionSortCode = `vector<Student *> insertionSort(
    int &comparisons)
{
    comparisons = 0;

    vector<Student *> records;

    Student *current = head;

    while (current != nullptr)
    {
        records.push_back(current);
        current = current->next;
    }

    for (
        int i = 1;
        i < static_cast<int>(records.size());
        i++)
    {
        Student *key =
            records[i];

        int j = i - 1;

        while (j >= 0)
        {
            comparisons++;

            if (
                records[j]->cgpa <=
                key->cgpa)
            {
                break;
            }

            records[j + 1] =
                records[j];

            j--;
        }

        records[j + 1] = key;
    }

    return records;
}`;

const mergeSortCode = `void mergeStudents(
    vector<Student *> &records,
    vector<Student *> &temp,
    int left,
    int middle,
    int right,
    int &comparisons)
{
    int i = left;
    int j = middle + 1;
    int k = left;

    while (
        i <= middle &&
        j <= right)
    {
        comparisons++;

        if (
            records[i]->cgpa <=
            records[j]->cgpa)
        {
            temp[k] = records[i];
            i++;
        }
        else
        {
            temp[k] = records[j];
            j++;
        }

        k++;
    }

    while (i <= middle)
    {
        temp[k] = records[i];
        i++;
        k++;
    }

    while (j <= right)
    {
        temp[k] = records[j];
        j++;
        k++;
    }

    for (
        int index = left;
        index <= right;
        index++)
    {
        records[index] = temp[index];
    }
}

void mergeSortRecursive(
    vector<Student *> &records,
    vector<Student *> &temp,
    int left,
    int right,
    int &comparisons)
{
    if (left >= right)
    {
        return;
    }

    int middle =
        left + (right - left) / 2;

    mergeSortRecursive(
        records, temp,
        left, middle,
        comparisons);

    mergeSortRecursive(
        records, temp,
        middle + 1, right,
        comparisons);

    mergeStudents(
        records, temp,
        left, middle, right,
        comparisons);
}

vector<Student *> mergeSort(
    int &comparisons)
{
    comparisons = 0;

    vector<Student *> records;

    Student *current = head;

    while (current != nullptr)
    {
        records.push_back(current);
        current = current->next;
    }

    if (records.empty())
    {
        return records;
    }

    vector<Student *> temp(records.size());

    mergeSortRecursive(
        records, temp,
        0,
        static_cast<int>(records.size()) - 1,
        comparisons);

    return records;
}`;

const stackCode = `stack<StackOperation> undoStack;

void pushOperation(
    string type,
    Student student)
{
    undoStack.push({type,
                    student});
}

bool undoOperation(
    StackOperation &operation)
{
    if (undoStack.empty())
    {
        return false;
    }

    operation =
        undoStack.top();

    undoStack.pop();

    return true;
}`;

const queueCode = `void enqueueOperation(
    string type,
    Student student)
{
    studentQueue.push({type,
                       student});
}

bool dequeueOperation(
    QueueOperation &operation)
{
    if (studentQueue.empty())
    {
        return false;
    }

    operation =
        studentQueue.front();

    studentQueue.pop();

    return true;
}

int queueSize() const
{
    return static_cast<int>(
        studentQueue.size());
}

bool queueFront(
    QueueOperation &operation)
{
    if (studentQueue.empty())
    {
        return false;
    }

    operation =
        studentQueue.front();

    return true;
}`;

const linkedListCode = `Student *current =
    students.getHead();

int count = 0;

while (current != nullptr)
{
    cout
        << "NODE|"
        << current->rollNo
        << "|"
        << current->name
        << endl;

    count++;

    current =
        current->next;
}`;

const doublyLinkedListCode = `struct DoublyNode
{
    Student student;
    DoublyNode *prev;
    DoublyNode *next;

    DoublyNode(Student s)
        : student(s),
          prev(nullptr),
          next(nullptr)
    {
    }
};

void append(Student student)
{
    DoublyNode *newNode =
        new DoublyNode(student);

    if (head == nullptr)
    {
        head = newNode;
        tail = newNode;
        return;
    }

    newNode->prev = tail;
    tail->next = newNode;
    tail = newNode;
}

void displayForward()
{
    DoublyNode *current = head;

    while (current != nullptr)
    {
        cout
            << "NODE|"
            << current->student.rollNo
            << "|"
            << current->student.name
            << endl;

        current = current->next;
    }
}

void displayBackward()
{
    DoublyNode *current = tail;

    while (current != nullptr)
    {
        cout
            << "NODE|"
            << current->student.rollNo
            << "|"
            << current->student.name
            << endl;

        current = current->prev;
    }
}`;

const algorithms = [
    ["linear-search", "Searching", "Linear Search", "O(n)"],
    ["binary-search", "Searching", "Binary Search", "O(log n)"],
    ["insertion-sort", "Sorting", "Insertion Sort", "O(n²)"],
    ["merge-sort", "Sorting", "Merge Sort", "O(n log n)"],
    ["stack", "Data Structures", "Stack / Undo", "O(1)"],
    ["queue", "Data Structures", "Queue", "O(1)"],
    ["linked-list", "Data Structures", "Singly Linked List", "O(n)"],
    ["doubly-linked-list", "Data Structures", "Doubly Linked List", "O(n)"],
].map(([id, category, title, complexity]) => ({
    id, category, title, complexity
}));

const insertionStates = [
    {
        values: [8.9, 8.5, 9.1, 8.2],
        key: null,
        message: "Initial vector copied from the linked list."
    },
    {
        values: [8.5, 8.9, 9.1, 8.2],
        key: 8.5,
        message: "Key = 8.5. 8.9 is greater, so it is shifted right and the key is inserted."
    },
    {
        values: [8.5, 8.9, 9.1, 8.2],
        key: 9.1,
        message: "Key = 9.1. The previous value 8.9 <= 9.1, so the loop breaks."
    },
    {
        values: [8.2, 8.5, 8.9, 9.1],
        key: 8.2,
        message: "Key = 8.2. Larger values are shifted right until 8.2 reaches the front."
    }
];

const mergeStates = [
    {
        groups: [[8.9, 8.5], [9.1, 8.2]],
        final: null,
        message: "Divide the records into left and right halves."
    },
    {
        groups: [[8.5, 8.9], [8.2, 9.1]],
        final: null,
        message: "Each half is sorted recursively."
    },
    {
        groups: [],
        final: [8.2, 8.5, 8.9, 9.1],
        message: "mergeStudents compares both halves and writes the sorted result."
    }
];

function Controls({ step, max, setStep }) {
    return (
        <div style={styles.controls}>
            <button
                style={styles.button}
                disabled={step <= 0}
                onClick={() => setStep(step - 1)}
            >
                ← Previous
            </button>

            <button
                style={styles.primary}
                disabled={step >= max}
                onClick={() => setStep(step + 1)}
            >
                Next →
            </button>

            <button
                style={styles.button}
                onClick={() => setStep(0)}
            >
                ↻ Reset
            </button>
        </div>
    );
}

function Result({ children }) {
    return <div style={styles.result}>{children}</div>;
}

function CodeSection({ code }) {
    return (
        <section style={styles.section}>
            <h2>① C++ Code</h2>
            <p>
                Code shown here is the corresponding implementation
                from <code>student_list.cpp</code>.
            </p>
            <pre style={styles.code}>{code}</pre>
        </section>
    );
}

function Explanation({ children }) {
    return (
        <section style={styles.section}>
            <h2>② How It Works</h2>
            <div style={styles.explanation}>{children}</div>
        </section>
    );
}

function Visualization({ children }) {
    return (
        <section style={styles.section}>
            <h2>③ Visualization</h2>
            {children}
        </section>
    );
}

function DSALab() {
    const [selected, setSelected] = useState(null);
    const [step, setStep] = useState(0);

    const open = (item) => {
        setSelected(item);
        setStep(0);
    };

    if (!selected) {
        return (
            <div style={styles.page}>
                <div style={styles.header}>
                    <div style={styles.eyebrow}>DSA LAB</div>
                    <h1 style={styles.title}>
                        Data Structures & Algorithms Lab
                    </h1>
                    <p style={styles.subtitle}>
                        Actual C++ code → explanation → step-by-step visualization.
                    </p>
                </div>

                {["Searching", "Sorting", "Data Structures"].map(category => (
                    <section key={category} style={styles.category}>
                        <h2>{category}</h2>

                        <div style={styles.grid}>
                            {algorithms
                                .filter(a => a.category === category)
                                .map(item => (
                                    <button
                                        key={item.id}
                                        style={styles.card}
                                        onClick={() => open(item)}
                                    >
                                        <h3>{item.title}</h3>
                                        <p>
                                            Complexity: <strong>{item.complexity}</strong>
                                        </p>
                                        <span>Open Lab →</span>
                                    </button>
                                ))}
                        </div>
                    </section>
                ))}
            </div>
        );
    }

    const id = selected.id;

    return (
        <div style={styles.page}>
            <button
                style={styles.back}
                onClick={() => {
                    setSelected(null);
                    setStep(0);
                }}
            >
                ← Back to DSA Lab
            </button>

            <div style={styles.header}>
                <div style={styles.eyebrow}>
                    DSA LAB / {selected.category}
                </div>
                <h1 style={styles.title}>{selected.title}</h1>
                <p style={styles.subtitle}>
                    Time Complexity: <strong>{selected.complexity}</strong>
                </p>
            </div>

            {id === "linear-search" && (
                <>
                    <CodeSection code={linearSearchCode} />
                    <Explanation>
                        <p><b>1.</b> Start at <code>head</code>.</p>
                        <p><b>2.</b> Increment <code>comparisons</code>.</p>
                        <p><b>3.</b> Compare <code>current-&gt;rollNo</code> with the target.</p>
                        <p><b>4.</b> If not equal, execute <code>current = current-&gt;next</code>.</p>
                    </Explanation>
                    <Visualization>
                        <p>Target roll number: <b>103</b></p>
                        <div style={styles.nodes}>
                            {[101, 102, 103, 104].map((value, index) => (
                                <React.Fragment key={value}>
                                    <div style={{
                                        ...styles.node,
                                        ...(index === step ? styles.active : {}),
                                        ...(value === 103 && step >= 2 ? styles.found : {})
                                    }}>
                                        <b>{value}</b>
                                        <small>{index === step ? "current" : "node"}</small>
                                        {value === 103 && step >= 2 && <small>FOUND ✓</small>}
                                    </div>
                                    {index < 3 && <span style={styles.arrow}>→</span>}
                                </React.Fragment>
                            ))}
                        </div>
                        <Controls step={step} max={2} setStep={setStep} />
                        <Result>
                            {step === 0 && "current = 101 → 101 != 103 → move next."}
                            {step === 1 && "current = 102 → 102 != 103 → move next."}
                            {step >= 2 && "current = 103 → 103 == 103 → return current."}
                        </Result>
                    </Visualization>
                </>
            )}

            {id === "binary-search" && (
                <>
                    <CodeSection code={binarySearchCode} />
                    <Explanation>
                        <p><b>1.</b> Copy linked-list nodes into <code>records</code>.</p>
                        <p><b>2.</b> Sort records by roll number.</p>
                        <p><b>3.</b> Calculate <code>middle</code>.</p>
                        <p><b>4.</b> Move left or right according to the comparison.</p>
                    </Explanation>
                    <Visualization>
                        <p>Target: <b>104</b></p>
                        <div style={styles.nodes}>
                            {[101, 102, 103, 104, 105].map((value, index) => {
                                const middle = step === 0 ? 2 : 3;
                                return (
                                    <div key={value} style={{
                                        ...styles.node,
                                        ...(index === middle ? styles.active : {}),
                                        ...(value === 104 && step >= 1 ? styles.found : {})
                                    }}>
                                        <b>{value}</b>
                                        <small>
                                            {index === middle ? "middle" : "record"}
                                        </small>
                                        {value === 104 && step >= 1 && <small>FOUND ✓</small>}
                                    </div>
                                );
                            })}
                        </div>
                        <Controls step={step} max={1} setStep={setStep} />
                        <Result>
                            {step === 0 && "middle = 103. 103 < 104 → left = middle + 1."}
                            {step >= 1 && "middle = 104. 104 == target → return record."}
                        </Result>
                    </Visualization>
                </>
            )}

            {id === "insertion-sort" && (
                <>
                    <CodeSection code={insertionSortCode} />
                    <Explanation>
                        <p><b>1.</b> Copy linked-list records into a vector.</p>
                        <p><b>2.</b> Select <code>records[i]</code> as <code>key</code>.</p>
                        <p><b>3.</b> Compare the key with previous CGPA values.</p>
                        <p><b>4.</b> Shift larger values and insert the key.</p>
                        <p><b>Important:</b> This visualization follows the exact condition in the supplied C++ implementation.</p>
                    </Explanation>
                    <Visualization>
                        <p>Sorting field: <b>CGPA</b></p>
                        <div style={styles.nodes}>
                            {insertionStates[step].values.map((value, index) => (
                                <div key={index} style={{
                                    ...styles.node,
                                    ...(value === insertionStates[step].key ? styles.active : {})
                                }}>
                                    <b>{value}</b>
                                    <small>{value === insertionStates[step].key ? "KEY" : "record"}</small>
                                </div>
                            ))}
                        </div>
                        <Controls step={step} max={3} setStep={setStep} />
                        <Result>{insertionStates[step].message}</Result>
                    </Visualization>
                </>
            )}

            {id === "merge-sort" && (
                <>
                    <CodeSection code={mergeSortCode} />
                    <Explanation>
                        <p><b>1.</b> Find the middle of the current range.</p>
                        <p><b>2.</b> Recursively sort the left and right halves.</p>
                        <p><b>3.</b> <code>mergeStudents()</code> compares both halves.</p>
                        <p><b>4.</b> Copy the merged values back into <code>records</code>.</p>
                    </Explanation>
                    <Visualization>
                        <p>CGPA demo: <b>8.9, 8.5, 9.1, 8.2</b></p>

                        {mergeStates[step].final ? (
                            <div style={styles.nodes}>
                                {mergeStates[step].final.map(v => (
                                    <div key={v} style={{ ...styles.node, ...styles.found }}>
                                        <b>{v}</b>
                                        <small>merged</small>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={styles.mergeGrid}>
                                {mergeStates[step].groups.map((group, index) => (
                                    <div key={index} style={styles.group}>
                                        {group.map(v => (
                                            <span key={v} style={styles.smallNode}>{v}</span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        <Controls step={step} max={2} setStep={setStep} />
                        <Result>{mergeStates[step].message}</Result>
                    </Visualization>
                </>
            )}

            {id === "stack" && (
                <>
                    <CodeSection code={stackCode} />
                    <Explanation>
                        <p><b>Push:</b> <code>undoStack.push()</code> adds an operation.</p>
                        <p><b>Top:</b> <code>undoStack.top()</code> reads the latest operation.</p>
                        <p><b>Pop:</b> <code>undoStack.pop()</code> removes the latest operation.</p>
                        <p>This is <b>LIFO — Last In, First Out</b>.</p>
                    </Explanation>
                    <Visualization>
                        <p>Demo operations: <b>ADD → UPDATE → DELETE</b></p>
                        <div style={styles.stack}>
                            {["ADD", "UPDATE", "DELETE"].slice(0, step + 1).map((v, i) => (
                                <div key={i} style={{
                                    ...styles.stackItem,
                                    ...(i === step ? styles.active : {})
                                }}>
                                    {v}
                                </div>
                            )).reverse()}
                        </div>
                        <Controls step={step} max={2} setStep={setStep} />
                        <Result>
                            {step === 0 && "PUSH ADD → ADD is now on top."}
                            {step === 1 && "PUSH UPDATE → UPDATE is now on top."}
                            {step >= 2 && "PUSH DELETE → DELETE is the top item (LIFO)."}
                        </Result>
                    </Visualization>
                </>
            )}

            {id === "queue" && (
                <>
                    <CodeSection code={queueCode} />
                    <Explanation>
                        <p><b>Enqueue:</b> <code>studentQueue.push()</code> adds at the back.</p>
                        <p><b>Front:</b> <code>studentQueue.front()</code> reads the first item.</p>
                        <p><b>Dequeue:</b> <code>studentQueue.pop()</code> removes the first item.</p>
                        <p>This is <b>FIFO — First In, First Out</b>.</p>
                    </Explanation>
                    <Visualization>
                        <p>Queue operations: <b>A → B → C</b></p>
                        <div style={styles.nodes}>
                            {["A", "B", "C"].map((v, index) => (
                                <div key={v} style={{
                                    ...styles.node,
                                    ...(index === 0 && step >= 1 ? styles.found : {}),
                                    opacity: step >= 1 && index === 0 ? 0.45 : 1
                                }}>
                                    <b>{v}</b>
                                    <small>{index === 0 ? "FRONT" : "queue"}</small>
                                </div>
                            ))}
                        </div>
                        <Controls step={step} max={1} setStep={setStep} />
                        <Result>
                            {step === 0 && "Queue: A → B → C. FRONT = A."}
                            {step >= 1 && "DEQUEUE removes A → remaining queue: B → C."}
                        </Result>
                    </Visualization>
                </>
            )}

            {id === "linked-list" && (
                <>
                    <CodeSection code={linkedListCode} />
                    <Explanation>
                        <p><b>1.</b> <code>current = students.getHead()</code>.</p>
                        <p><b>2.</b> Visit the current node.</p>
                        <p><b>3.</b> Move using <code>current = current-&gt;next</code>.</p>
                        <p><b>4.</b> Stop when <code>current == nullptr</code>.</p>
                    </Explanation>
                    <Visualization>
                        <p>Traversal follows the actual <code>next</code> pointer.</p>
                        <div style={styles.nodes}>
                            {[201, 202, 203].map((v, index) => (
                                <React.Fragment key={v}>
                                    <div style={{
                                        ...styles.node,
                                        ...(index === step ? styles.active : {}),
                                        ...(step >= 3 ? styles.found : {})
                                    }}>
                                        <b>{v}</b>
                                        <small>{index === step ? "current" : "node"}</small>
                                    </div>
                                    {index < 2 && <span style={styles.arrow}>→</span>}
                                </React.Fragment>
                            ))}
                        </div>
                        <Controls step={step} max={3} setStep={setStep} />
                        <Result>
                            {step === 0 && "current = HEAD (201)."}
                            {step === 1 && "current = current->next → 202."}
                            {step === 2 && "current = current->next → 203."}
                            {step >= 3 && "current = nullptr → traversal complete."}
                        </Result>
                    </Visualization>
                </>
            )}

            {id === "doubly-linked-list" && (
                <>
                    <CodeSection code={doublyLinkedListCode} />
                    <Explanation>
                        <p><b>append():</b> New node stores both <code>prev</code> and <code>next</code>.</p>
                        <p><b>Forward:</b> starts at <code>head</code> and follows <code>next</code>.</p>
                        <p><b>Backward:</b> starts at <code>tail</code> and follows <code>prev</code>.</p>
                    </Explanation>
                    <Visualization>
                        <p>Same three nodes, showing both directions.</p>
                        <div style={styles.doubly}>
                            {[301, 302, 303].map((v, index) => (
                                <React.Fragment key={v}>
                                    <div style={{
                                        ...styles.node,
                                        ...(index === (step <= 2 ? step : 4 - step) ? styles.active : {})
                                    }}>
                                        <small>prev</small>
                                        <b>{v}</b>
                                        <small>next</small>
                                    </div>
                                    {index < 2 && <span style={styles.arrow}>↔</span>}
                                </React.Fragment>
                            ))}
                        </div>
                        <Controls step={step} max={4} setStep={setStep} />
                        <Result>
                            {step === 0 && "HEAD = 301 → forward traversal starts."}
                            {step === 1 && "301 -> 302 using next."}
                            {step === 2 && "303 reached → TAIL."}
                            {step === 3 && "Backward: 303 -> 302 using prev."}
                            {step >= 4 && "Backward: 302 -> 301 → HEAD."}
                        </Result>
                    </Visualization>
                </>
            )}
        </div>
    );
}

const styles = {
    page: {
        padding: "28px",
        maxWidth: "1180px",
        margin: "0 auto",
    },
    header: {
        margin: "25px 0 32px",
    },
    eyebrow: {
        fontSize: "12px",
        fontWeight: 700,
        letterSpacing: "1.4px",
        marginBottom: "8px",
    },
    title: {
        margin: "0 0 10px",
        fontSize: "32px",
    },
    subtitle: {
        color: "#6b7280",
    },
    category: {
        marginBottom: "34px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
        gap: "16px",
        marginTop: "16px",
    },
    card: {
        minHeight: "140px",
        padding: "20px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        textAlign: "left",
        cursor: "pointer",
    },
    back: {
        padding: "9px 15px",
        background: "#fff",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        cursor: "pointer",
    },
    section: {
        marginTop: "20px",
        padding: "24px",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
    },
    code: {
        background: "#111827",
        color: "#f9fafb",
        padding: "20px",
        borderRadius: "10px",
        overflowX: "auto",
        lineHeight: 1.55,
        fontSize: "13px",
    },
    explanation: {
        lineHeight: 1.7,
    },
    nodes: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        marginTop: "22px",
    },
    node: {
        minWidth: "90px",
        minHeight: "76px",
        padding: "12px",
        border: "2px solid #d1d5db",
        borderRadius: "10px",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
    },
    active: {
        border: "3px solid #2563eb",
        background: "#eff6ff",
    },
    found: {
        border: "3px solid #16a34a",
        background: "#f0fdf4",
    },
    arrow: {
        fontSize: "23px",
        fontWeight: 700,
    },
    controls: {
        display: "flex",
        gap: "10px",
        marginTop: "24px",
        flexWrap: "wrap",
    },
    button: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "1px solid #d1d5db",
        background: "#fff",
        cursor: "pointer",
    },
    primary: {
        padding: "10px 16px",
        borderRadius: "8px",
        border: "none",
        background: "#111827",
        color: "#fff",
        cursor: "pointer",
    },
    result: {
        marginTop: "18px",
        padding: "15px",
        background: "#f9fafb",
        borderRadius: "10px",
        lineHeight: 1.6,
    },
    mergeGrid: {
        display: "flex",
        gap: "30px",
        flexWrap: "wrap",
        marginTop: "20px",
    },
    group: {
        display: "flex",
        gap: "8px",
        padding: "14px",
        border: "1px dashed #9ca3af",
        borderRadius: "10px",
    },
    smallNode: {
        padding: "10px 14px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        background: "#fff",
    },
    stack: {
        width: "180px",
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    stackItem: {
        padding: "15px",
        border: "2px solid #d1d5db",
        borderRadius: "8px",
        textAlign: "center",
        background: "#fff",
    },
    doubly: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        marginTop: "20px",
    },
};

export default DSALab;
