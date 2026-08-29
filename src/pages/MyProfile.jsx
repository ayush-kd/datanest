function MyProfile() {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            STUDENT PORTAL
          </p>

          <h1>My Profile</h1>

          <p>
            View your personal and academic
            information.
          </p>
        </div>
      </div>

      <div className="table-card">
        <div className="section-header">
          <div>
            <h3>Student Information</h3>
            <p>Your registered information</p>
          </div>
        </div>

        <div
          style={{
            padding: "20px",
            display: "grid",
            gap: "14px",
            color: "#68757e",
            fontSize: "13px",
          }}
        >
          <div>
            <strong>Name:</strong> Rahul Sharma
          </div>

          <div>
            <strong>Roll Number:</strong> 101
          </div>

          <div>
            <strong>Department:</strong> CSE
          </div>

          <div>
            <strong>Year:</strong> 2nd Year
          </div>

          <div>
            <strong>CGPA:</strong> 8.9
          </div>

          <div>
            <strong>Email:</strong>{" "}
            rahul@example.com
          </div>
        </div>
      </div>
    </>
  );
}

export default MyProfile;