import {
  createContext,
  useContext,
  useState,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem("datanest_user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("datanest_user");
      return null;
    }
  });

  // =====================================
  // LOGIN
  // =====================================

  const login = (
    emailOrData,
    password,
    role
  ) => {
    // Support both:
    // login(email, password, role)
    //
    // and:
    // login({ email, password, role })

    let email;
    let actualPassword;
    let actualRole;

    if (
      typeof emailOrData === "object" &&
      emailOrData !== null
    ) {
      email = emailOrData.email;
      actualPassword = emailOrData.password;
      actualRole = emailOrData.role;
    } else {
      email = emailOrData;
      actualPassword = password;
      actualRole = role;
    }

    // Make sure email is a string
    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    let authenticatedUser = null;

    // =====================================
    // TEACHER
    // =====================================

    if (
      actualRole === "teacher" &&
      cleanEmail === "teacher@datanest.com" &&
      actualPassword === "teacher123"
    ) {
      authenticatedUser = {
        name: "Teacher",
        email: "teacher@datanest.com",
        role: "teacher",
      };
    }

    // =====================================
    // STUDENT
    // =====================================

    if (
      actualRole === "student" &&
      cleanEmail === "student@datanest.com" &&
      actualPassword === "student123"
    ) {
      authenticatedUser = {
        name: "Rahul Sharma",
        email: "student@datanest.com",
        role: "student",
        rollNo: 101,
      };
    }

    // =====================================
    // INVALID
    // =====================================

    if (!authenticatedUser) {
      return {
        success: false,
        message:
          "Invalid email, password, or selected role.",
      };
    }

    // =====================================
    // SAVE USER
    // =====================================

    localStorage.setItem(
      "datanest_user",
      JSON.stringify(authenticatedUser)
    );

    setUser(authenticatedUser);

    return {
      success: true,
      user: authenticatedUser,
    };
  };

  // =====================================
  // LOGOUT
  // =====================================

  const logout = () => {
    localStorage.removeItem(
      "datanest_user"
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}