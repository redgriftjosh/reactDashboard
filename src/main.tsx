import React from "react";
import ReactDOM from "react-dom/client";
import UserContextProvider from "./lib/contexts/userContext.tsx";
import App from "./App.tsx";
import "./index.css";
import AuthContextProvider from "./lib/contexts/authContext.tsx";
// import { BrowserRouter } from "react-router-dom";

// Hello
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserContextProvider>
      <AuthContextProvider>
        <App />
      </AuthContextProvider>
    </UserContextProvider>
  </React.StrictMode>
);
