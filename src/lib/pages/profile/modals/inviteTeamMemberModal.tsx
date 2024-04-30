import { ChangeEvent, useState } from "react";
import { supabase } from "../../../helper/supabaseClient";
import { useUserContext } from "../../../contexts/userContext";

type InviteTeamMemberModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const InviteTeamMemberModal: React.FC<InviteTeamMemberModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useUserContext();
  interface FormState {
    email: string;
  }

  const [formData, setFormData] = useState<FormState>({
    email: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // console.log("form data", formData);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("form data", formData);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", formData.email);
    if (error) {
      console.error("Error getting user", error.message);
      return;
    }

    console.log("data", data);
    console.log("data.length", data.length);
    if (data.length === 1) {
      const { error: insertError } = await supabase
        .from("junction_user_companies")
        .insert({
          company_id: user?.companyId,
          user_id: data[0].id,
          role_id: 2,
        });

      if (insertError) {
        // if (insertError.message.includes("violates foreign key constraint")) {
        //   alert("User already in company");
        //   return;
        // }
        alert(insertError.message);
        return;
      }
    } else if (data.length > 1) {
      alert("Multiple users found with that email");
    } else {
      alert("User not found");
    }
  }

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <form
        className="bg-white p-6 rounded shadow-lg w-full sm:w-96"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl mb-4">Invite By Email</h2>
        <div className="flex">
          <div className="mb-4 flex-1 mr-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              placeholder="jane.doe@coolcompany.com"
              onChange={handleChange}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Invite
        </button>
        <div className="flex justify-center">
          <button
            type="button"
            className="mt-2 hover:text-red-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default InviteTeamMemberModal;
