import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignInUpOTP from "./lib/pages/auth/signInUpOTP";
import Profile from "./lib/pages/profile/profile";
import NotFound from "./lib/pages/notFound";
import { useFetchCompany, useFetchUser } from "./lib/helper/hooks";
import RedirectComponent from "./lib/pages/auth/redirect";
import EditCompany from "./lib/pages/profile/editCompany";
import CompanyWaypoints from "./lib/pages/companyWaypoints/companyWaypoints";
import Jobs from "./lib/pages/jobs/jobs";
import EditJob from "./lib/pages/jobs/editJob";
import AddJob from "./lib/pages/jobs/addJob";
import Dashboards from "./lib/pages/dashboards/dashboards";
import EditDashboard from "./lib/pages/dashboards/editDashboard";
import AddDashboard from "./lib/pages/dashboards/addDashboard";
// import ViewDashboard from "./lib/pages/dashboards/viewDashboard";
import "./customStyles.css";
import ViewDashboard1 from "./lib/pages/dashboards/viewDashboard copy";
import { supabase } from "./lib/helper/supabaseClient";

//prettier-ignore
const App = () => {
  const { user, loading } = useFetchUser();
  useFetchCompany();
  test();
  async function test() {
    const { data, error } = await supabase
    .from('companies')
    .select()
    console.log("companies: ", data);
  }

  // console.log("Redirect", import.meta.env.VITE_EMAIL_REDIRECT_URL);

  // Without this, the user will see a flash of the login page before being redirected to the profile page when they refresh.
  // Even if they're not on the profile page so it's annoying.
  if (loading) {
    return null;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RedirectComponent />} />
        <Route path="/login" element={!user ? <SignInUpOTP /> : <Navigate to="/profile" replace />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} /> 
        <Route path="/edit-company" element={user ? <EditCompany /> : <Navigate to="/login" replace />} /> 

        <Route path="/company-waypoints" element={user ? <CompanyWaypoints /> : <Navigate to="/login" replace />} />

        <Route path="/jobs" element={user ? <Jobs /> : <Navigate to="/login" replace />} />
        <Route path="/edit-job" element={user ? <EditJob /> : <Navigate to="/login" replace />} />
        <Route path="/add-job" element={user ? <AddJob /> : <Navigate to="/login" replace />} />

        <Route path="/dashboards" element={user ? <Dashboards /> : <Navigate to="/login" replace />} />
        <Route path="/edit-dashboard" element={user ? <EditDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/add-dashboard" element={user ? <AddDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/view-dashboard" element={user ? <ViewDashboard1 /> : <Navigate to="/login" replace />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
