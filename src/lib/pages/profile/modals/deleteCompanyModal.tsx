import { useState } from "react";
import { supabase } from "../../../helper/supabaseClient";
import { useCompanyContext } from "../../../contexts/companyContext";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../../contexts/userContext";

type DeleteCompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DeleteCompanyModal: React.FC<DeleteCompanyModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deleteText, setDeleteText] = useState<string>("");
  const { company, setCompany } = useCompanyContext();
  const { user, setUser } = useUserContext();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteText === "DELETE" && company) {
      await supabase.from("companies").delete().eq("id", company.id);
      if (user) setUser({ ...user, active_company_id: null });
      setCompany(null);
      navigate("/profile");
    } else {
      alert("Please type 'DELETE' to confirm");
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <form
        className="bg-white p-6 rounded shadow-lg w-full sm:w-96"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl mb-4">Delete Company?</h2>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete this company and all of its jobs and
          waypoints? This action cannot be undone so I just want to make sure
          you're sure.
        </p>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Type: "DELETE" to confirm
          </label>
          <input
            type="companyName"
            id="comanyName"
            name="companyName"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
            placeholder="DELETE"
            onChange={(e) => setDeleteText(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Delete
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

export default DeleteCompanyModal;
