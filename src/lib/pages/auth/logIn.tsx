// import { ChangeEvent, useState, FormEvent } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "../../helper/supabaseClient";
// import { useUserContext } from "../../contexts/userContext";

// export default function LogIn({ setToken }: { setToken: any }) {
//   // Define a Formstate Object with the input fields
//   interface FormState {
//     email: string;
//     password: string;
//   }

//   const { setUser } = useUserContext();

//   const [formData, setFormData] = useState<FormState>({
//     email: "",
//     password: "",
//   });
//   const navigate = useNavigate();

//   const handleSignUpRedirect = () => {
//     navigate("/signup");
//   };

//   const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
//     const { name, value } = e.target;
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }));
//   };

//   async function getUser(userId: string) {
//     const { data, error } = await supabase
//       .from("users")
//       .select()
//       .eq("id", userId);
//     if (error) {
//       console.log("error getting company", error.message);
//       return null;
//     } else {
//       console.log("getUser", data);
//       return data[0];
//     }
//   }

//   async function getCompanyName(companyId: number) {
//     const { data, error } = await supabase
//       .from("companies")
//       .select()
//       .eq("id", companyId);
//     if (error) {
//       console.log("error getting company", error.message);
//       return null;
//     } else {
//       console.log("getUser", data);
//       return data[0].company_name;
//     }
//   }

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email: formData.email,
//       password: formData.password,
//     });

//     if (error) {
//       alert(error.message);
//     } else {
//       const getUserData = await getUser(data.user.id); // Await the getUser function to get the companyId
//       const companyName = await getCompanyName(getUserData.active_company_id); // Await the getCompanyName function to get the companyName
//       setToken(true);
//       // setUser({
//       //   id: data.user.id,
//       //   email: data.user.email ?? "",
//       //   firstName: getUserData.first_name,
//       //   lastName: getUserData.last_name,
//       //   companyId: getUserData.active_company_id,
//       //   companyName: companyName,
//       // });
//       navigate("/profile"); // Redirect after successful login
//     }
//     // console.log(data, error);
//   }

//   return (
//     <div className="flex items-center justify-center h-screen">
//       <form
//         className="bg-white p-6 rounded shadow-lg w-full sm:w-96"
//         onSubmit={handleSubmit}
//       >
//         <h2 className="text-2xl mb-4">Log In</h2>
//         <div className="mb-4">
//           <label
//             htmlFor="email"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Email
//           </label>
//           <input
//             type="email"
//             id="email"
//             name="email"
//             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
//             placeholder="John@doe.ca"
//             onChange={handleChange}
//           />
//         </div>
//         <div className="mb-4">
//           <label
//             htmlFor="password"
//             className="block text-sm font-medium text-gray-700"
//           >
//             Password
//           </label>
//           <input
//             type="password"
//             id="password"
//             name="password"
//             className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
//             placeholder="Enter your password"
//             onChange={handleChange}
//           />
//         </div>
//         <button
//           type="submit"
//           className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
//         >
//           Log In 🚀
//         </button>
//         <div className="flex justify-center">
//           <button
//             type="button"
//             className="mt-2 hover:text-indigo-600"
//             onClick={handleSignUpRedirect}
//           >
//             Create Account?
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }
