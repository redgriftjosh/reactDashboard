import { useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import SignUp from "./lib/pages/auth/signUp";
import Profile from "./lib/pages/profile/profile";
import LogIn from "./lib/pages/auth/logIn";
import NotFound from "./lib/pages/notFound";
import { supabase } from "./lib/helper/supabaseClient";
import { useAuthContext } from "./lib/contexts/authContext";
import EditCompany from "./lib/pages/profile/editCompany";
import CompanyWaypoints from "./lib/pages/companyWaypoints/companyWaypoints";
import Jobs from "./lib/pages/jobs/jobs";
import AddJob from "./lib/pages/jobs/addJob";
import EditJob from "./lib/pages/jobs/editJob";
import Dashboards from "./lib/pages/dashboards/dashboards";
import AddDashboard from "./lib/pages/dashboards/addDashboard";
import EditDashboard from "./lib/pages/dashboards/editDashboard";
import ViewDashboard from "./lib/pages/dashboards/viewDashboard";

const App = () => {
  const { token, setToken } = useAuthContext(); // Just a bool for isLoggedIn

  if (token) {
    sessionStorage.setItem("token", JSON.stringify(token));
  }

  useEffect(() => {
    async function fetchSession() {
      // Get's the current session from Local Storage then varifies with Supabase if it's still valid
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.log("Error fetching session", error.message);
        localStorage.clear();
        setToken(false);
        return;
      } else if (data) {
        // console.log("Session data", data);
        setToken(true);
      } else {
        console.log("Wait how did this even exicute?");
        // system.deleteSystem32();
      }
    }

    fetchSession();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/profile"
          element={token ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/company-waypoints"
          element={
            token ? <CompanyWaypoints /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/jobs"
          element={token ? <Jobs /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/add-job"
          element={token ? <AddJob /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/edit-job"
          element={token ? <EditJob /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboards"
          element={token ? <Dashboards /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/add-dashboard"
          element={token ? <AddDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/edit-dashboard"
          element={token ? <EditDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/view-dashboard"
          element={token ? <ViewDashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/signup"
          element={token ? <Navigate to="/profile" replace /> : <SignUp />}
        />
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/profile" replace />
            ) : (
              <LogIn setToken={setToken} />
            )
          }
        />
        <Route
          path="/edit-company"
          element={token ? <EditCompany /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={<Navigate to={token ? "/profile" : "/login"} replace />}
        />
        {/* Fallback route for 404 Not Found page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
