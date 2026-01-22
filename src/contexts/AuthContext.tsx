import { createContext, useContext, useState, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "parent" | "admin";
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: "teacher" | "parent") => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: Record<string, { password: string; user: User }> = {
  "teacher@mahima.edu": {
    password: "teacher123",
    user: {
      id: "T101",
      name: "Shashi Bhan",
      email: "teacher@mahima.edu",
      role: "teacher",
    },
  },
  "parent@mahima.edu": {
    password: "parent123",
    user: {
      id: "P101",
      name: "Rajesh Kumar",
      email: "parent@mahima.edu",
      role: "parent",
    },
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("mahima_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const mockUser = mockUsers[email];
    if (mockUser && mockUser.password === password) {
      setUser(mockUser.user);
      localStorage.setItem("mahima_user", JSON.stringify(mockUser.user));
      return true;
    }
    return false;
  };

  const signup = async (
    name: string,
    email: string,
    password: string,
    role: "teacher" | "parent"
  ): Promise<boolean> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // In a real app, this would create the user in the database
    const newUser: User = {
      id: `U${Date.now()}`,
      name,
      email,
      role,
    };
    setUser(newUser);
    localStorage.setItem("mahima_user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mahima_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
