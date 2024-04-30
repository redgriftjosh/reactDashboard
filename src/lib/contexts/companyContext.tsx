import React, {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";

type Company = {
  id: number;
  companyName: string;
};

type CompanyContextProviderProps = {
  children: ReactNode;
};

type CompanyContext = {
  company: Company | null;
  setCompany: React.Dispatch<React.SetStateAction<Company | null>>;
};

export const CompanyContext = createContext<CompanyContext | null>(null);

export default function CompanyContextProvider({
  children,
}: CompanyContextProviderProps) {
  const [company, setCompany] = useState<Company | null>(() => {
    const savedUserData = localStorage.getItem("company");
    return savedUserData ? JSON.parse(savedUserData) : null;
  });

  // Update localStorage whenever the user changes
  useEffect(() => {
    if (company) {
      localStorage.setItem("company", JSON.stringify(company));
    } else {
      localStorage.removeItem("company");
    }
  }, [company]);

  return (
    <CompanyContext.Provider value={{ company, setCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompanyContext() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error(
      "useCompanyContext must be used within a UserContextProvider"
    );
  }
  return context;
}
