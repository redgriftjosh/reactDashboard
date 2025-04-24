import { useState } from "react";
import { supabase } from "../../helper/supabaseClient";
// import LogIn from "./logIn";

export default function SignInUpOTP() {
  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  // const [signInMethod, setSignInMethod] = useState<"otp" | "login" | "signup">("otp");

  async function HandleLogIn() {
    if (!email) {
      alert("Email is required, unfortunately.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // emailRedirectTo: "http://tpi-3-dashboard.com/",
        // emailRedirectTo: "http://localhost:5173/",
        emailRedirectTo: import.meta.env.VITE_EMAIL_REDIRECT_URL,
      },
    });
    console.log(data, error);
    if (error) {
      alert("Error logging in: " + error.message);
      return;
    } else {
      // if (data.user) {
      //   await supabase.from("users").insert({
      //     id: data.user.id,
      //     first_name: formData.firstName,
      //     last_name: formData.lastName,
      //     email: formData.email,
      //   });
      // }
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white p-6 rounded shadow-lg w-full sm:w-96">
          <h2 className="text-2xl text-green-500 flex justify-center">Success!</h2>
          <h3 className="text-lg mb-4 text-gray-500 flex justify-center">We Sent You an Email</h3>
          <p className="text-center">We sent a Magic Link to your email.</p>
          <p className="text-center mb-4">Click the link to log in!</p>

          <button
            onClick={() => setSuccess(false)} // Pass the event argument to the LogIn function
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-6 rounded shadow-lg w-full sm:w-96">
        <>
          <h2 className="text-2xl mb-4">Login or Create an Account</h2>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              placeholder="John@doe.ca"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            onClick={() => HandleLogIn()} // Pass the event argument to the LogIn function
            type="submit"
            className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Submit
          </button>
          <button
            onClick={() => alert("Sign in with password clicked")} // Define your password login functionality here
            className="mt-4 text-indigo-500 hover:text-indigo-600 focus:outline-none"
          >
            Use Password Instead?
          </button>
        </>
        {/* {signInMethod === "otp" ? (
          <>
            <h2 className="text-2xl mb-4">Login or Create an Account</h2>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
                placeholder="John@doe.ca"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              onClick={() => HandleLogIn()} // Pass the event argument to the LogIn function
              type="submit"
              className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Submit
            </button>
            <button
            onClick={() => alert('Sign in with password clicked')} // Define your password login functionality here
            className="mt-4 text-indigo-500 hover:text-indigo-600 focus:outline-none"
          >
            Use Password Instead?
          </button>
          </>
        ) : (
          // <LogIn/>
        )} */}
      </div>
    </div>
  );
}
