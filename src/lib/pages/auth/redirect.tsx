import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../helper/supabaseClient";

const RedirectComponent = () => {
  const navigate = useNavigate();

  async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    const { session } = data; // const { session, user } = data;
    navigate(session ? "/profile" : "/login");

    if (error) console.error("Session error", error.message);
  }

  useEffect(() => {
    refreshSession();
  }, []);

  return null;
};

export default RedirectComponent;
