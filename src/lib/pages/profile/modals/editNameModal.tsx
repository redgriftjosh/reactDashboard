import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useUserContext } from "../../../contexts/userContext";
import { supabase } from "../../../helper/supabaseClient";

type EditNameModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const EditNameModal: React.FC<EditNameModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useUserContext();

  interface FormState {
    firstName: string;
    lastName: string;
  }

  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
      });
      //   console.log("User", user);
    }
  }, [isOpen]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    console.log("form data", formData);
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const { error } = await supabase
      .from("users")
      .update({
        first_name: formData.firstName,
        last_name: formData.lastName,
      })
      .eq("id", user?.id);
    if (error) {
      alert(error.message);
    } else {
      if (!user) return;
      const newUser = {
        id: user?.id,
        created_at: user?.created_at,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: user?.email,
        active_company_id: user?.active_company_id,
      };
      setUser(newUser);
      onClose();
    }
  }

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <form
        className="bg-white p-6 rounded shadow-lg w-full sm:w-96"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl mb-4">Update Your Name</h2>
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
              value={formData.firstName}
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
              value={formData.lastName}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              placeholder="Doe"
              onChange={handleChange}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save
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

export default EditNameModal;
