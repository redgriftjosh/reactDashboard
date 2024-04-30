import { ChangeEvent, FormEvent, useState } from "react";
import { supabase } from "../../../helper/supabaseClient";
import { useUserContext } from "../../../contexts/userContext";

type CreateCompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  addCompany: () => void;
};

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  addCompany,
}) => {
  const { user } = useUserContext();

  interface FormState {
    companyName: string;
  }

  const [formData, setFormData] = useState<FormState>({
    companyName: "",
  });

  const handleClose = () => {
    onClose();
    setFormData({ companyName: "" });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    console.log("form data", formData);
  };

  async function insertJunctionTable(companyId: number) {
    const { data, error } = await supabase
      .from("junction_user_companies")
      .insert({ company_id: companyId, user_id: user?.id, role_id: 1 })
      .select();
    if (error) {
      alert(error.message);
    } else {
      console.log("insertJunctionTable", data);

      // clear formData
      setFormData({ companyName: "" });
      onClose();
    }
  }

  async function insertCompaniesTable() {
    const { data, error } = await supabase
      .from("companies")
      .insert({ company_name: formData.companyName })
      .select();
    if (error) {
      alert(error.message);
    } else {
      console.log("insertCompaniesTable", data);
      return data[0].id;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (formData.companyName === "") {
      alert("Please enter a company name");
      return;
    }

    const company_id = await insertCompaniesTable();

    await insertJunctionTable(company_id);
    addCompany();
    setFormData({ companyName: "" });
    onClose();
  }

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <form
        className="bg-white p-6 rounded shadow-lg w-full sm:w-96"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl mb-4">Create a Company</h2>
        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Company Name
          </label>
          <input
            type="companyName"
            id="comanyName"
            name="companyName"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
            placeholder="My Company LTD."
            onChange={handleChange}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create
        </button>
        <div className="flex justify-center">
          <button
            type="button"
            className="mt-2 hover:text-red-600"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompanyModal;
