import { useEffect, useState } from "react";
import { apiFetch } from "../config/api";

export default function TeacherProfile() {
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
        <h1>Teacher Profile</h1>

        <h2>{profile.name}</h2>

        <p>
          <strong>Email:</strong> {profile.email}
        </p>

        <p>
          <strong>Role:</strong> Teacher
        </p>

        <p>
          <strong>Total Students:</strong>{" "}
          {profile.studentCount}
        </p>

        <p>
          <strong>Teacher ID:</strong>{" "}
          {String(profile.teacherId)}
        </p>
      </div>
    </div>
  );
}