import React, { createContext, useState, ReactNode, useContext } from "react";
import { TCompany } from "../types/types";

type CompanyContextProviderProps = {
  children: ReactNode;
};

type CompanyContext = {
  company: TCompany | null;
  setCompany: React.Dispatch<React.SetStateAction<TCompany | null>>;
};

export const CompanyContext = createContext<CompanyContext | null>(null);

export default function CompanyContextProvider({
  children,
}: CompanyContextProviderProps) {
  const [company, setCompany] = useState<TCompany | null>(null);

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
