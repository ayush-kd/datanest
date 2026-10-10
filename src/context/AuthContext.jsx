import API_URL from "../config/api";
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

  const login = async (
    emailOrData,
    password,
    role
  ) => {
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

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password: actualPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          message:
            data.message ||
            "Login failed.",
        };
      }

      // Make sure selected role matches backend role
      if (actualRole && data.user.role !== actualRole) {
        return {
          success: false,
          message:
            "Selected role does not match this account.",
        };
      }

      // Save JWT
      localStorage.setItem(
        "datanest_token",
        data.token
      );

      // Save user
      localStorage.setItem(
        "datanest_user",
        JSON.stringify(data.user)
      );

      setUser(data.user);

      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      console.error("Login error:", error);

      return {
        success: false,
        message:
          "Unable to connect to DataNest server.",
      };
    }
  };

  // =====================================
  // LOGOUT
  // =====================================

  const logout = () => {
    localStorage.removeItem(
      "datanest_user"
    );
    localStorage.removeItem("datanest_token");

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