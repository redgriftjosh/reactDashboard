import { ReactNode, createContext, useContext, useState } from "react";

// This is the type of the context. It cannot just ba a bool becasue we need to be able to change it
type AuthContext = {
  token: boolean;
  setToken: React.Dispatch<React.SetStateAction<boolean>>;
};

// This is the context itself
export const AuthContext = createContext<AuthContext>({} as AuthContext);

// This is the type for the provider props
type AuthContextProviderProps = {
  children: ReactNode; // This is the children that will be wrapped by the provider
};

// This is the provider for the context that will wrap the entire app in App.tsx
export default function AuthContextProvider({
  children,
}: AuthContextProviderProps) {
  const [token, setToken] = useState(true); // Just a bool for isLoggedIn
  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to get/update the user context from any component
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserContextProvider");
  }
  return context;
}
