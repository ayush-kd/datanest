import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute({
  children,
  role,
}) {
  const {
    user,
    isAuthenticated,
  } = useAuth();

  // --------------------------------
  // NOT LOGGED IN
  // --------------------------------

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // --------------------------------
  // WRONG ROLE
  // --------------------------------

  if (
    role &&
    user.role !== role
  ) {
    if (user.role === "teacher") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    if (user.role === "student") {
      return (
        <Navigate
          to="/student-dashboard"
          replace
        />
      );
    }
  }

  return children;
}

export default ProtectedRoute;