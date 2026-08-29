#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <algorithm>
#include <stack>
#include <queue>

using namespace std;

// ==========================================
// STUDENT NODE
// ==========================================

struct Student
{
    int rollNo;
    string name;
    string email;
    string department;
    string year;
    double cgpa;
    string status;

    Student *next;

    Student(
        int rollNo,
        string name,
        string email,
        string department,
        string year,
        double cgpa,
        string status = "Active")
    {
        this->rollNo = rollNo;
        this->name = name;
        this->email = email;
        this->department = department;
        this->year = year;
        this->cgpa = cgpa;
        this->status = status;
        this->next = nullptr;
    }
};

// ==========================================
// UNDO HISTORY FILE HELPERS
// ==========================================

bool saveUndoOperation(
    const string &filename,
    const string &type,
    const Student &student)
{
    ofstream file(filename);

    if (!file.is_open())
    {
        return false;
    }

    file
        << type << "|"
        << student.rollNo << "|"
        << student.name << "|"
        << student.email << "|"
        << student.department << "|"
        << student.year << "|"
        << student.cgpa << "|"
        << student.status
        << "\n";

    file.close();

    return true;
}

bool loadUndoOperation(
    const string &filename,
    string &type,
    Student &student)
{
    ifstream file(filename);

    if (!file.is_open())
    {
        return false;
    }

    string line;

    if (!getline(file, line))
    {
        file.close();
        return false;
    }

    file.close();

    stringstream ss(line);

    string rollNo;
    string name;
    string email;
    string department;
    string year;
    string cgpa;
    string status;

    getline(ss, type, '|');
    getline(ss, rollNo, '|');
    getline(ss, name, '|');
    getline(ss, email, '|');
    getline(ss, department, '|');
    getline(ss, year, '|');
    getline(ss, cgpa, '|');
    getline(ss, status, '|');

    student = Student(
        stoi(rollNo),
        name,
        email,
        department,
        year,
        stod(cgpa),
        status);

    return true;
}

void clearUndoHistory(
    const string &filename)
{
    ofstream file(filename);
    file.close();
}

void clearRedoHistory(
    const string &filename)
{
    ofstream file(filename);
    file.close();
}

// ======================================
// STACK OPERATION
// ======================================

struct StackOperation
{
    string type;
    Student student;
};

// ======================================
// QUEUE OPERATION
// ======================================

struct QueueOperation
{
    string type;
    Student student;
};
// ==========================================
// SINGLY LINKED LIST
// ==========================================

class StudentLinkedList
{

private:
    Student *head;

public:
    // ======================================
    // UNDO STACK
    // ======================================

    stack<StackOperation> undoStack;

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
    }

    bool deleteStudentWithoutStack(
        int rollNo)
    {
        if (head == nullptr)
        {
            return false;
        }

        if (head->rollNo == rollNo)
        {
            Student *temp = head;

            head = head->next;

            delete temp;

            return true;
        }

        Student *current = head;

        while (
            current->next != nullptr &&
            current->next->rollNo != rollNo)
        {
            current = current->next;
        }

        if (current->next == nullptr)
        {
            return false;
        }

        Student *temp =
            current->next;

        current->next =
            temp->next;

        delete temp;

        return true;
    }

    bool insertStudentWithoutStack(
        Student student)
    {
        Student *newStudent =
            new Student(
                student.rollNo,
                student.name,
                student.email,
                student.department,
                student.year,
                student.cgpa,
                student.status);

        if (head == nullptr)
        {
            head = newStudent;
            return true;
        }

        Student *current = head;

        while (
            current->next != nullptr)
        {
            current = current->next;
        }

        current->next =
            newStudent;

        return true;
    }

    bool updateStudentWithoutStack(
        Student oldStudent)
    {
        Student *student =
            searchStudent(
                oldStudent.rollNo);

        if (student == nullptr)
        {
            return false;
        }

        student->name =
            oldStudent.name;

        student->email =
            oldStudent.email;

        student->department =
            oldStudent.department;

        student->year =
            oldStudent.year;

        student->cgpa =
            oldStudent.cgpa;

        student->status =
            oldStudent.status;

        return true;
    }

    // ==========================================
    // PERSISTENT UNDO
    // ==========================================

    bool performUndo(
        const string &undoFile,
        const string &redoFile,
        string &undoneType,
        Student &undoneStudent)
    {
        string type;

        Student student(
            0,
            "",
            "",
            "",
            "",
            0.0,
            "Active");

        if (!loadUndoOperation(
                undoFile,
                type,
                student))
        {
            return false;
        }

        // This is what Redo will need later.
        Student redoStudent = student;

        if (type == "UPDATE")
        {
            Student *current =
                searchStudent(
                    student.rollNo);

            if (current == nullptr)
            {
                return false;
            }

            // Save the NEW version.
            redoStudent = *current;
        }

        bool success = false;

        if (type == "ADD")
        {
            // Undo ADD = delete
            success =
                deleteStudentWithoutStack(
                    student.rollNo);
        }
        else if (type == "DELETE")
        {
            // Undo DELETE = restore
            success =
                insertStudentWithoutStack(
                    student);
        }
        else if (type == "UPDATE")
        {
            // Undo UPDATE = restore old version
            success =
                updateStudentWithoutStack(
                    student);
        }

        if (success)
        {
            undoneType = type;
            undoneStudent = student;

            // Save operation needed for REDO
            saveUndoOperation(
                redoFile,
                type,
                redoStudent);

            clearUndoHistory(
                undoFile);
        }

        return success;
    }

    bool performRedo(
        const string &redoFile,
        string &redoType,
        Student &redoStudent)
    {
        string type;

        Student student(
            0,
            "",
            "",
            "",
            "",
            0.0,
            "Active");

        if (!loadUndoOperation(
                redoFile,
                type,
                student))
        {
            return false;
        }

        bool success = false;

        if (type == "ADD")
        {
            // Redo ADD = add again
            success =
                insertStudentWithoutStack(
                    student);
        }
        else if (type == "DELETE")
        {
            // Redo DELETE = delete again
            success =
                deleteStudentWithoutStack(
                    student.rollNo);
        }
        else if (type == "UPDATE")
        {
            // Redo UPDATE = apply new version
            success =
                updateStudentWithoutStack(
                    student);
        }

        if (success)
        {
            redoType = type;
            redoStudent = student;

            clearRedoHistory(
                redoFile);
        }

        return success;
    }

    bool undo()
    {
        if (undoStack.empty())
        {
            return false;
        }

        StackOperation operation =
            undoStack.top();

        undoStack.pop();

        if (operation.type == "ADD")
        {
            // Undo ADD = delete student
            return deleteStudentWithoutStack(
                operation.student.rollNo);
        }

        if (operation.type == "DELETE")
        {
            // Undo DELETE = restore student
            return insertStudentWithoutStack(
                operation.student);
        }

        if (operation.type == "UPDATE")
        {
            // Undo UPDATE = restore old data
            return updateStudentWithoutStack(
                operation.student);
        }

        return false;
    }

    int stackSize() const
    {
        return static_cast<int>(
            undoStack.size());
    }

    StudentLinkedList()
    {
        head = nullptr;
    }

    // ======================================
    // INSERT
    // ======================================

    bool insertStudent(
        int rollNo,
        string name,
        string email,
        string department,
        string year,
        double cgpa,
        string status = "Active")
    {

        if (searchStudent(rollNo) != nullptr)
        {
            return false;
        }

        Student *newStudent =
            new Student(
                rollNo,
                name,
                email,
                department,
                year,
                cgpa,
                status);

        if (head == nullptr)
        {
            head = newStudent;

            pushOperation(
                "ADD",
                *newStudent);

            saveUndoOperation(
                "dsa/undo_history.txt",
                "ADD",
                *newStudent);

            return true;
        }
        Student *current = head;

        while (current->next != nullptr)
        {
            current = current->next;
        }

        current->next = newStudent;

        pushOperation(
            "ADD",
            *newStudent);

        saveUndoOperation(
            "dsa/undo_history.txt",
            "ADD",
            *newStudent);

        return true;
    }

    // ======================================
    // QUEUE
    // ======================================

    queue<QueueOperation> studentQueue;

    void enqueueOperation(
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
    }
    // ======================================
    // SEARCH
    // ======================================

    Student *searchStudent(int rollNo)
    {

        Student *current = head;

        while (current != nullptr)
        {

            if (current->rollNo == rollNo)
            {
                return current;
            }

            current = current->next;
        }

        return nullptr;
    }

    // ======================================
    // LINEAR SEARCH WITH COMPARISON COUNT
    // ======================================

    Student *linearSearch(
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
    }

    // ======================================
    // BINARY SEARCH WITH COMPARISON COUNT
    // ======================================

    Student *binarySearch(
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
    }

    // ======================================
    // INSERTION SORT
    // ======================================

    vector<Student *> insertionSort(
        int &comparisons)
    {
        comparisons = 0;

        vector<Student *> records;

        Student *current = head;

        // Copy linked-list records into vector
        while (current != nullptr)
        {
            records.push_back(current);
            current = current->next;
        }

        // Insertion Sort by CGPA
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
    }

    // ======================================
    // MERGE SORT HELPER
    // ======================================

    void mergeStudents(
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
                temp[k] =
                    records[i];

                i++;
            }
            else
            {
                temp[k] =
                    records[j];

                j++;
            }

            k++;
        }

        while (i <= middle)
        {
            temp[k] =
                records[i];

            i++;
            k++;
        }

        while (j <= right)
        {
            temp[k] =
                records[j];

            j++;
            k++;
        }

        for (
            int index = left;
            index <= right;
            index++)
        {
            records[index] =
                temp[index];
        }
    }

    // ======================================
    // MERGE SORT RECURSIVE FUNCTION
    // ======================================

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
            left +
            (right - left) / 2;

        mergeSortRecursive(
            records,
            temp,
            left,
            middle,
            comparisons);

        mergeSortRecursive(
            records,
            temp,
            middle + 1,
            right,
            comparisons);

        mergeStudents(
            records,
            temp,
            left,
            middle,
            right,
            comparisons);
    }

    // ======================================
    // MERGE SORT
    // ======================================

    vector<Student *> mergeSort(
        int &comparisons)
    {

        comparisons = 0;

        vector<Student *> records;

        Student *current = head;

        while (
            current != nullptr)
        {

            records.push_back(
                current);

            current =
                current->next;
        }

        if (records.empty())
        {
            return records;
        }

        vector<Student *> temp(
            records.size());

        mergeSortRecursive(
            records,
            temp,
            0,
            static_cast<int>(
                records.size()) -
                1,
            comparisons);

        return records;
    }

    // ======================================
    // DELETE
    // ======================================

    bool deleteStudent(int rollNo)
    {
        if (head == nullptr)
        {
            return false;
        }

        if (head->rollNo == rollNo)
        {
            Student oldStudent = *head;

            Student *temp = head;

            head = head->next;

            pushOperation(
                "DELETE",
                oldStudent);

            saveUndoOperation(
                "dsa/undo_history.txt",
                "DELETE",
                oldStudent);

            delete temp;

            return true;
        }

        Student *current = head;

        while (
            current->next != nullptr &&
            current->next->rollNo != rollNo)
        {
            current = current->next;
        }

        if (current->next == nullptr)
        {
            return false;
        }

        Student oldStudent =
            *(current->next);

        Student *temp =
            current->next;

        current->next =
            temp->next;

        pushOperation(
            "DELETE",
            oldStudent);

        saveUndoOperation(
            "dsa/undo_history.txt",
            "DELETE",
            oldStudent);

        delete temp;

        return true;
    }
    // ======================================
    // UPDATE
    // ======================================

    bool updateStudent(
        int rollNo,
        string name,
        string email,
        string department,
        string year,
        double cgpa)
    {

        Student *student =
            searchStudent(rollNo);

        if (student == nullptr)
        {
            return false;
        }

        // Save OLD version for Undo
        Student oldStudent = *student;

        student->name = name;
        student->email = email;
        student->department = department;
        student->year = year;
        student->cgpa = cgpa;

        pushOperation(
            "UPDATE",
            oldStudent);

        saveUndoOperation(
            "dsa/undo_history.txt",
            "UPDATE",
            oldStudent);

        return true;
    }

    // ======================================
    // GET HEAD
    // ======================================

    Student *getHead()
    {
        return head;
    }

    // ======================================
    // SAVE TO FILE
    // ======================================

    bool saveToFile(
        const string &filename)
    {

        ofstream file(filename);

        if (!file.is_open())
        {
            return false;
        }

        Student *current = head;

        while (current != nullptr)
        {

            file
                << current->rollNo << "|"
                << current->name << "|"
                << current->email << "|"
                << current->department << "|"
                << current->year << "|"
                << current->cgpa << "|"
                << current->status
                << "\n";

            current = current->next;
        }

        file.close();

        return true;
    }

    // ======================================
    // LOAD FROM FILE
    // ======================================

    bool loadFromFile(
        const string &filename)
    {

        ifstream file(filename);

        if (!file.is_open())
        {
            return false;
        }

        string line;

        while (getline(file, line))
        {

            if (line.empty())
            {
                continue;
            }

            stringstream ss(line);

            string rollNo;
            string name;
            string email;
            string department;
            string year;
            string cgpa;
            string status;

            getline(ss, rollNo, '|');
            getline(ss, name, '|');
            getline(ss, email, '|');
            getline(ss, department, '|');
            getline(ss, year, '|');
            getline(ss, cgpa, '|');
            getline(ss, status, '|');

            insertStudent(
                stoi(rollNo),
                name,
                email,
                department,
                year,
                stod(cgpa),
                status);
        }

        file.close();

        return true;
    }

    // ======================================
    // ADD DEFAULT DATA
    // ======================================

    void createDefaultStudents()
    {

        insertStudent(
            101,
            "Rahul Sharma",
            "rahul@datanest.com",
            "CSE",
            "2nd",
            8.9);

        insertStudent(
            102,
            "Aman Patil",
            "aman@datanest.com",
            "E&TC",
            "2nd",
            8.5);

        insertStudent(
            103,
            "Neha Joshi",
            "neha@datanest.com",
            "IT",
            "3rd",
            9.1);

        insertStudent(
            104,
            "Arjun Singh",
            "arjun@datanest.com",
            "CSE",
            "1st",
            8.2);
    }

    // ======================================
    // DESTRUCTOR
    // ======================================

    ~StudentLinkedList()
    {

        Student *current = head;

        while (current != nullptr)
        {

            Student *next =
                current->next;

            delete current;

            current = next;
        }

        head = nullptr;
    }
};

// ==========================================
// DOUBLY LINKED LIST NODE
// ==========================================

struct DoublyNode
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

// ==========================================
// DOUBLY LINKED LIST
// ==========================================

class DoublyLinkedList
{
private:
    DoublyNode *head;
    DoublyNode *tail;

public:
    DoublyLinkedList()
    {
        head = nullptr;
        tail = nullptr;
    }

    // INSERT AT END
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

    // FORWARD TRAVERSAL
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

    // BACKWARD TRAVERSAL
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
    }

    // SIZE
    int size()
    {
        int count = 0;

        DoublyNode *current = head;

        while (current != nullptr)
        {
            count++;
            current = current->next;
        }

        return count;
    }

    // HEAD
    DoublyNode *getHead()
    {
        return head;
    }

    // TAIL
    DoublyNode *getTail()
    {
        return tail;
    }

    ~DoublyLinkedList()
    {
        DoublyNode *current = head;

        while (current != nullptr)
        {
            DoublyNode *next =
                current->next;

            delete current;

            current = next;
        }

        head = nullptr;
        tail = nullptr;
    }
};

// ==========================================
// MAIN
// ==========================================

int main(int argc, char *argv[])
{

    const string DATA_FILE =
        "dsa/students.txt";

    const string UNDO_FILE =
        "dsa/undo_history.txt";

    const string REDO_FILE =
        "dsa/redo_history.txt";

    StudentLinkedList students;

    // ======================================
    // LOAD EXISTING DATA
    // ======================================

    bool loaded =
        students.loadFromFile(DATA_FILE);

    // ======================================
    // CREATE INITIAL DATA IF FILE DOES
    // NOT EXIST
    // ======================================

    if (!loaded)
    {

        students.createDefaultStudents();

        students.saveToFile(DATA_FILE);
    }

    // ======================================
    // LIST COMMAND
    // ======================================

    if (
        argc > 1 &&
        string(argv[1]) == "list")
    {

        Student *current =
            students.getHead();

        while (current != nullptr)
        {

            cout
                << current->rollNo
                << "|"
                << current->name
                << "|"
                << current->email
                << "|"
                << current->department
                << "|"
                << current->year
                << "|"
                << current->cgpa
                << "|"
                << current->status
                << endl;

            current = current->next;
        }

        return 0;
    }

    // ======================================
    // SEARCH COMMAND
    // ======================================

    if (
        argc > 2 &&
        string(argv[1]) == "search")
    {

        int rollNo =
            stoi(argv[2]);

        Student *found =
            students.searchStudent(rollNo);

        if (found != nullptr)
        {

            cout
                << found->rollNo
                << "|"
                << found->name
                << "|"
                << found->email
                << "|"
                << found->department
                << "|"
                << found->year
                << "|"
                << found->cgpa
                << "|"
                << found->status
                << endl;
        }
        else
        {

            cout << "NOT_FOUND" << endl;
        }

        return 0;
    }

    // ======================================
    // LINEAR SEARCH COMMAND
    // ======================================

    if (
        argc > 2 &&
        string(argv[1]) == "linear-search")
    {

        int rollNo =
            stoi(argv[2]);

        int comparisons = 0;

        Student *found =
            students.linearSearch(
                rollNo,
                comparisons);

        if (found != nullptr)
        {

            cout
                << "FOUND|"
                << found->rollNo
                << "|"
                << found->name
                << "|"
                << found->email
                << "|"
                << found->department
                << "|"
                << found->year
                << "|"
                << found->cgpa
                << "|"
                << found->status
                << "|"
                << comparisons
                << endl;
        }
        else
        {

            cout
                << "NOT_FOUND|"
                << comparisons
                << endl;
        }

        return 0;
    }

    // ======================================
    // BINARY SEARCH COMMAND
    // ======================================

    if (
        argc > 2 &&
        string(argv[1]) == "binary-search")
    {

        int rollNo =
            stoi(argv[2]);

        int comparisons = 0;

        Student *found =
            students.binarySearch(
                rollNo,
                comparisons);

        if (found != nullptr)
        {

            cout
                << "FOUND|"
                << found->rollNo
                << "|"
                << found->name
                << "|"
                << found->email
                << "|"
                << found->department
                << "|"
                << found->year
                << "|"
                << found->cgpa
                << "|"
                << found->status
                << "|"
                << comparisons
                << endl;
        }
        else
        {

            cout
                << "NOT_FOUND|"
                << comparisons
                << endl;
        }

        return 0;
    }

    // ======================================
    // INSERTION SORT COMMAND
    // ======================================

    if (
        argc > 1 &&
        string(argv[1]) == "insertion-sort")
    {

        int comparisons = 0;

        vector<Student *> sortedStudents =
            students.insertionSort(
                comparisons);

        cout
            << "SORTED|"
            << comparisons
            << endl;

        for (
            Student *student :
            sortedStudents)
        {

            cout
                << student->rollNo
                << "|"
                << student->name
                << "|"
                << student->email
                << "|"
                << student->department
                << "|"
                << student->year
                << "|"
                << student->cgpa
                << "|"
                << student->status
                << endl;
        }

        cout
            << "COMPLEXITY|O(n^2)"
            << endl;

        return 0;
    }

    // ======================================
    // MERGE SORT COMMAND
    // ======================================

    if (
        argc > 1 &&
        string(argv[1]) == "merge-sort")
    {

        int comparisons = 0;

        vector<Student *> sortedStudents =
            students.mergeSort(
                comparisons);

        cout
            << "SORTED|"
            << comparisons
            << endl;

        for (
            Student *student :
            sortedStudents)
        {

            cout
                << student->rollNo
                << "|"
                << student->name
                << "|"
                << student->email
                << "|"
                << student->department
                << "|"
                << student->year
                << "|"
                << student->cgpa
                << "|"
                << student->status
                << endl;
        }

        cout
            << "COMPLEXITY|O(n log n)"
            << endl;

        return 0;
    }

    // ======================================
    // ADD COMMAND
    // ======================================

    if (
        argc > 7 &&
        string(argv[1]) == "add")
    {

        int rollNo =
            stoi(argv[2]);

        string name =
            argv[3];

        string email =
            argv[4];

        string department =
            argv[5];

        string year =
            argv[6];

        double cgpa =
            stod(argv[7]);

        bool inserted =
            students.insertStudent(
                rollNo,
                name,
                email,
                department,
                year,
                cgpa);

        if (!inserted)
        {

            cout
                << "DUPLICATE_ROLL_NO"
                << endl;

            return 1;
        }

        bool saved =
            students.saveToFile(
                DATA_FILE);

        if (!saved)
        {

            cout
                << "SAVE_FAILED"
                << endl;

            return 1;
        }

        cout
            << "STUDENT_ADDED"
            << endl;

        return 0;
    }

    // ======================================
    // DELETE COMMAND
    // ======================================

    if (
        argc > 2 &&
        string(argv[1]) == "delete")
    {

        int rollNo =
            stoi(argv[2]);

        bool deleted =
            students.deleteStudent(rollNo);

        if (!deleted)
        {

            cout
                << "NOT_FOUND"
                << endl;

            return 1;
        }

        bool saved =
            students.saveToFile(DATA_FILE);

        if (!saved)
        {

            cout
                << "SAVE_FAILED"
                << endl;

            return 1;
        }

        cout
            << "STUDENT_DELETED"
            << endl;

        return 0;
    }

    // ======================================
    // UPDATE COMMAND
    // ======================================

    if (
        argc > 7 &&
        string(argv[1]) == "update")
    {

        int rollNo =
            stoi(argv[2]);

        string name =
            argv[3];

        string email =
            argv[4];

        string department =
            argv[5];

        string year =
            argv[6];

        double cgpa =
            stod(argv[7]);

        bool updated =
            students.updateStudent(
                rollNo,
                name,
                email,
                department,
                year,
                cgpa);

        if (!updated)
        {

            cout
                << "NOT_FOUND"
                << endl;

            return 1;
        }

        bool saved =
            students.saveToFile(
                DATA_FILE);

        if (!saved)
        {

            cout
                << "SAVE_FAILED"
                << endl;

            return 1;
        }

        cout
            << "STUDENT_UPDATED"
            << endl;

        return 0;
    }

    // ======================================
    // UNDO COMMAND
    // ======================================

    // ======================================
    // UNDO COMMAND
    // ======================================

    if (
        argc > 1 &&
        string(argv[1]) == "undo")
    {
        string undoneType;

        Student undoneStudent(
            0,
            "",
            "",
            "",
            "",
            0.0,
            "Active");

        bool undone =
            students.performUndo(
                UNDO_FILE,
                REDO_FILE,
                undoneType,
                undoneStudent);

        if (!undone)
        {
            cout
                << "NOTHING_TO_UNDO"
                << endl;

            return 1;
        }

        bool saved =
            students.saveToFile(
                DATA_FILE);

        if (!saved)
        {
            cout
                << "SAVE_FAILED"
                << endl;

            return 1;
        }

        cout
            << "UNDO_SUCCESS|"
            << undoneType
            << "|"
            << undoneStudent.rollNo
            << "|"
            << undoneStudent.name
            << endl;
        return 0;
    }

    // ======================================
    // REDO COMMAND
    // ======================================

    if (
        argc > 1 &&
        string(argv[1]) == "redo")
    {
        string redoType;

        Student redoStudent(
            0,
            "",
            "",
            "",
            "",
            0.0,
            "Active");

        bool redone =
            students.performRedo(
                REDO_FILE,
                redoType,
                redoStudent);

        if (!redone)
        {
            cout
                << "NOTHING_TO_REDO"
                << endl;

            return 1;
        }

        bool saved =
            students.saveToFile(
                DATA_FILE);

        if (!saved)
        {
            cout
                << "SAVE_FAILED"
                << endl;

            return 1;
        }

        cout
            << "REDO_SUCCESS|"
            << redoType
            << "|"
            << redoStudent.rollNo
            << "|"
            << redoStudent.name
            << endl;

        return 0;
    }

    // ======================================
    // QUEUE TEST
    // Actual students + FIFO
    // ======================================

    if (
        argc > 1 &&
        string(argv[1]) == "queue-test")
    {
        // ======================================
        // ADD ALL CURRENT STUDENTS TO QUEUE
        // ======================================

        Student *current =
            students.getHead();

        while (current != nullptr)
        {
            students.enqueueOperation(
                "ADD",
                *current);

            current =
                current->next;
        }

        // ======================================
        // INITIAL SIZE
        // ======================================

        int initialSize =
            students.queueSize();

        cout
            << "QUEUE_SIZE|"
            << initialSize
            << endl;

        // ======================================
        // GET FRONT STUDENT
        // ======================================

        QueueOperation frontOperation = {
            "",
            Student(
                0,
                "",
                "",
                "",
                "",
                0.0,
                "Active")};

        if (
            students.queueFront(
                frontOperation))
        {
            cout
                << "FRONT|"
                << frontOperation.student.rollNo
                << "|"
                << frontOperation.student.name
                << endl;
        }
        else
        {
            cout
                << "ERROR|Queue is empty"
                << endl;

            return 1;
        }

        // ======================================
        // DEQUEUE FRONT
        // ======================================

        QueueOperation operation = {
            "",
            Student(
                0,
                "",
                "",
                "",
                "",
                0.0,
                "Active")};

        if (
            students.dequeueOperation(
                operation))
        {
            cout
                << "DEQUEUE|"
                << operation.student.rollNo
                << "|"
                << operation.student.name
                << endl;

            // ==================================
            // REMOVE SAME STUDENT FROM
            // ACTUAL STUDENT LIST
            // ==================================

            bool removed =
                students.deleteStudentWithoutStack(
                    operation.student.rollNo);

            if (!removed)
            {
                cout
                    << "ERROR|Unable to remove student"
                    << endl;

                return 1;
            }

            // ==================================
            // SAVE UPDATED STUDENT LIST
            // ==================================

            if (
                !students.saveToFile(
                    DATA_FILE))
            {
                cout
                    << "ERROR|Unable to save students"
                    << endl;

                return 1;
            }
        }

        // ======================================
        // FINAL SIZE
        // ======================================

        cout
            << "QUEUE_SIZE|"
            << students.queueSize()
            << endl;

        return 0;
    }

    // ======================================
    // DOUBLY LINKED LIST TEST COMMAND
    // ======================================

    if (
        argc > 1 &&
        string(argv[1]) == "doubly-linked-list-test")
    {
        DoublyLinkedList doublyList;

        // ==================================
        // USE ACTUAL STUDENT DATA
        // ==================================

        Student *current =
            students.getHead();

        while (current != nullptr)
        {
            doublyList.append(*current);

            current =
                current->next;
        }

        // ==================================
        // SIZE
        // ==================================

        cout
            << "SIZE|"
            << doublyList.size()
            << endl;

        // ==================================
        // HEAD
        // ==================================

        DoublyNode *head =
            doublyList.getHead();

        if (head != nullptr)
        {
            cout
                << "HEAD|"
                << head->student.rollNo
                << "|"
                << head->student.name
                << endl;
        }
        else
        {
            cout << "HEAD|0|EMPTY" << endl;
        }

        // ==================================
        // TAIL
        // ==================================

        DoublyNode *tail =
            doublyList.getTail();

        if (tail != nullptr)
        {
            cout
                << "TAIL|"
                << tail->student.rollNo
                << "|"
                << tail->student.name
                << endl;
        }
        else
        {
            cout << "TAIL|0|EMPTY" << endl;
        }

        // ==================================
        // FORWARD TRAVERSAL
        // ==================================

        cout << "FORWARD" << endl;

        doublyList.displayForward();

        // ==================================
        // BACKWARD TRAVERSAL
        // ==================================

        cout << "BACKWARD" << endl;

        doublyList.displayBackward();

        return 0;
    }

    // ======================================
    // LINKED LIST TEST COMMAND
    // ======================================

    if (
        argc > 1 &&
        string(argv[1]) == "linked-list-test")
    {
        Student *current =
            students.getHead();

        int count = 0;

        // Traverse the linked list
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
        }

        cout
            << "HEAD|";

        Student *head =
            students.getHead();

        if (head != nullptr)
        {
            cout
                << head->rollNo
                << "|"
                << head->name;
        }
        else
        {
            cout << "EMPTY";
        }

        cout << endl;

        // Find tail
        Student *tail = nullptr;

        current =
            students.getHead();

        while (current != nullptr)
        {
            tail = current;
            current = current->next;
        }

        cout
            << "TAIL|";

        if (tail != nullptr)
        {
            cout
                << tail->rollNo
                << "|"
                << tail->name;
        }
        else
        {
            cout << "EMPTY";
        }

        cout << endl;

        cout
            << "SIZE|"
            << count
            << endl;

        return 0;
    }

    // ======================================
    // DEFAULT
    // ======================================

    cout
        << "DataNest C++ Linked List Engine"
        << endl;

    cout
        << "Commands:"
        << endl;

    cout
        << "list"
        << endl;

    cout
        << "search <rollNo>"
        << endl;

    cout
        << "add <rollNo> <name> <email> "
        << "<department> <year> <cgpa>"
        << endl;

    return 0;
}