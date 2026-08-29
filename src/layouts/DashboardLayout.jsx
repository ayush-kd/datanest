import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import { useAuth } from "../context/AuthContext";

function DashboardLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const { user } = useAuth();

  const role = user?.role || "teacher";

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-shell">

      {/* MOBILE OVERLAY */}
      <div
        className={`mobile-overlay ${mobileMenuOpen ? "show" : ""
          }`}
        onClick={closeMobileMenu}
      />

      {/* SIDEBAR */}
      <div
        className={`sidebar-container ${mobileMenuOpen ? "mobile-open" : ""
          }`}
      >
        <Sidebar
          role={role}
          onClose={closeMobileMenu}
        />
      </div>

      {/* MAIN AREA */}
      <div className="main-area">

        <Topbar
          role={role}
          onMenuClick={() =>
            setMobileMenuOpen(true)
          }
        />

        <main className="page-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;