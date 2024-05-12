import { createContext, useState, ReactNode, useContext } from "react";
import { TUser } from "../types/types";

type UserContextProviderProps = {
  children: ReactNode;
};

type UserContext = {
  user: TUser | null;
  setUser: (user: TUser | null) => void;
};

export const UserContext = createContext<UserContext | null>(null);

// The UserContextProvider component provides the user context to its children
export default function UserContextProvider({
  children,
}: UserContextProviderProps) {
  const [user, setUser] = useState<TUser | null>(null);

  // Provide the user context to its children
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to get/update the user context from any component
export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserContextProvider");
  }
  return context;
}
