import { ChangeEvent, useState, FormEvent } from "react";
import { supabase } from "../../helper/supabaseClient";
import { useNavigate } from "react-router";

export default function SignUp() {
  // Define a Formstate Object with the input fields
  interface FormState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }

  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleLoginRedirect = () => {
    navigate("/login"); // Assumes '/login' is the path for the login page
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });
    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
      });
    }

    console.log(data); // data.user.id is the uuid of the user

    // insert a new row in tbl_users make the uuid the same as the auth.uid

    if (error) {
      if (error.message.includes("Anonymous sign-ins are disabled")) {
        alert("Please Enter all fields");
        return;
      }

      // duplicate key value violates unique constraint "tbl_users_pkey"

      alert(error.message);
      return;
    }

    if (data.user) {
      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
      });

      if (insertError) {
        if (
          insertError.message.includes(
            'duplicate key value violates unique constraint "tbl_users_pkey"'
          )
        ) {
          alert("Check your email for the confirmation link.");
          return;
        }
        alert(insertError.message);
        return;
      } else {
        alert("Check your email for the confirmation link.");
      }
    }
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        className="bg-white p-6 rounded shadow-lg w-full sm:w-96"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl mb-4">Create Account</h2>
        <div className="flex">
          <div className="mb-4 flex-1 mr-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              placeholder="John"
              onChange={handleChange}
            />
          </div>
          <div className="mb-4 flex-1 ml-2">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              placeholder="Doe"
              onChange={handleChange}
            />
          </div>
        </div>
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
            onChange={handleChange}
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
            placeholder="Enter your password"
            onChange={handleChange}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Sign Up
        </button>
        <div className="flex justify-center">
          <button
            type="button"
            className="mt-2 hover:text-indigo-600"
            onClick={handleLoginRedirect}
          >
            Log In Instead?
          </button>
        </div>
      </form>
    </div>
  );
}
