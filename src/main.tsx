import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import UserContextProvider from "./lib/contexts/userContext.tsx";
import CompanyContextProvider from "./lib/contexts/companyContext.tsx";

// Hello
ReactDOM.createRoot(document.getElementById("root")!).render(
  <CompanyContextProvider>
    <UserContextProvider>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </UserContextProvider>
  </CompanyContextProvider>
);
