import {
  LayoutDashboard,
  Users,
  Search,
  ListOrdered,
  ArrowDownUp,
  GitBranch,
  Inbox,
  Undo2,
  Boxes,
  BarChart3,
  Settings,
  GraduationCap,
  UserCircle,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const teacherMenu = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Students",
    path: "/students",
    icon: Users,
  },
  {
    label: "Search",
    path: "/search",
    icon: Search,
  },
  {
    label: "Sorting",
    path: "/sorting",
    icon: ArrowDownUp,
  },
  {
    label: "Requests",
    path: "/requests",
    icon: Inbox,
  },
  {
    label: "Undo / Stack",
    path: "/stack",
    icon: Undo2,
  },
  {
    label: "Queue",
    path: "/queue",
    icon: ListOrdered,
  },
  {
    label: "Linked List",
    path: "/linked-list",
    icon: GitBranch,
  },
  {
    label: "DSA Lab",
    path: "/dsalab",
    icon: Boxes,
  },
];

const studentMenu = [
  {
    label: "Dashboard",
    path: "/student-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Profile",
    path: "/my-profile",
    icon: UserCircle,
  },
  {
    label: "My Requests",
    path: "/my-requests",
    icon: Inbox,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

function Sidebar({
  role = "teacher",
  onClose,
}) {
  const menu =
    role === "teacher"
      ? teacherMenu
      : studentMenu;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <GraduationCap size={22} />
        </div>

        <div className="brand-text">
          <strong>DataNest</strong>
          <span>Student Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-heading">
          {role === "teacher"
            ? "TEACHER PORTAL"
            : "STUDENT PORTAL"}
        </p>

        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="role-card">
          <div className="role-avatar">
            {role === "teacher" ? "T" : "S"}
          </div>

          <div>
            <strong>
              {role === "teacher"
                ? "Teacher"
                : "Student"}
            </strong>

            <span>
              {role === "teacher"
                ? "Faculty Account"
                : "Student Account"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;