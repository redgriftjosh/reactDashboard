import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";
import { supabase } from "../helper/supabaseClient";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId?: number;
  companyName?: string;
};

type UserContextProviderProps = {
  children: ReactNode;
};

type UserContext = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

export const UserContext = createContext<UserContext | null>(null);

// The UserContextProvider component provides the user context to its children
export default function UserContextProvider({
  children,
}: UserContextProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUserData = localStorage.getItem("user");
    return savedUserData ? JSON.parse(savedUserData) : null;
  });

  // Listen for changes to the user in the database and update the context
  const subscription = supabase
    .channel("user")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
      },
      (payload) => {
        setUser({
          id: payload.new.id,
          email: payload.new.email,
          firstName: payload.new.first_name,
          lastName: payload.new.last_name,
        });
      }
    )
    .subscribe();

  // Update localStorage whenever the user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      console.log("user", user);
    } else {
      localStorage.removeItem("user");
    }

    // Stop listening when the component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

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
