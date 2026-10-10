import { useEffect, useState } from "react";
import { apiFetch } from "../config/api";

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await apiFetch("/api/profile");
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Profile error:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!profile) {
    return <div>Unable to load profile.</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1>My Profile</h1>

        <h2>{profile.name}</h2>

        <p>
          <strong>Email:</strong> {profile.email}
        </p>

        <p>
          <strong>Roll Number:</strong> {profile.rollNo}
        </p>

        <p>
          <strong>Department:</strong> {profile.department}
        </p>

        <p>
          <strong>Year:</strong> {profile.year}
        </p>

        <p>
          <strong>CGPA:</strong> {profile.cgpa}
        </p>

        <p>
          <strong>Attendance:</strong> {profile.attendance ?? 0}%
        </p>

        <p>
          <strong>Teacher:</strong>{" "}
          {profile.teacherName || "Not assigned"}
        </p>
      </div>
    </div>
  );
}