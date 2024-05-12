import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

const RedirectUserIfLoggedIn = () => {
const navigate = useNavigate();

  async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    const { session } = data; // const { session, user } = data;
    if (session) {
      navigate("/profile");
    }

    if (error) console.error("Session error", error.message);
  }

  useEffect(() => {
    refreshSession();
  }, []);
};

export default RedirectUserIfLoggedIn;