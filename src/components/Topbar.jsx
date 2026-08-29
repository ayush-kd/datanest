import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  LogOut,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Topbar({
  onMenuClick,
  role = "teacher",
}) {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  // Use the authenticated user's role.
  // The role prop remains as a fallback.
  const currentRole =
    user?.role || role;

  const isTeacher =
    currentRole === "teacher";

  // =====================================
  // LOGOUT
  // =====================================

  const handleLogout = () => {
    logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="topbar">

      {/* ============================== */}
      {/* MOBILE MENU */}
      {/* ============================== */}

      <button
        className="mobile-menu-button"
        onClick={onMenuClick}
        type="button"
      >
        <Menu size={21} />
      </button>

      {/* ============================== */}
      {/* SEARCH */}
      {/* ============================== */}

      <div className="topbar-search">

        <Search size={18} />

        <input
          type="text"
          placeholder={
            isTeacher
              ? "Search students..."
              : "Search..."
          }
        />

        <span>⌘ K</span>

      </div>

      {/* ============================== */}
      {/* RIGHT ACTIONS */}
      {/* ============================== */}

      <div className="topbar-actions">

        {/* NOTIFICATION */}

        <button
          className="icon-button"
          type="button"
        >
          <Bell size={19} />

          <span className="notification-dot" />
        </button>

        {/* PROFILE */}

        <div className="profile">

          <div className="profile-avatar">
            {isTeacher ? "T" : "S"}
          </div>

          <div className="profile-info">

            <strong>
              {isTeacher
                ? "Teacher"
                : "Student"}
            </strong>

            <span>
              {isTeacher
                ? "Faculty"
                : "Student Account"}
            </span>

          </div>

          <ChevronDown size={16} />

          {/* LOGOUT */}

          <button
            className="logout-button"
            type="button"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={14} />

            <span>
              Logout
            </span>
          </button>

        </div>

      </div>

    </header>
  );
}

export default Topbar;