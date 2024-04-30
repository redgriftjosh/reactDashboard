import { useUserContext } from "../../../contexts/userContext";
import { supabase } from "../../../helper/supabaseClient";

type SwitchCompanyModalProps = {
  isOpen: number | null;
  companyName: string;
  onClose: () => void;
};

const SwitchCompanyModal: React.FC<SwitchCompanyModalProps> = ({
  isOpen,
  companyName,
  onClose,
}) => {
  const { setUser } = useUserContext();
  const handleClose = () => {
    onClose();
  };

  async function handleSwitchCompany() {
    const { data, error } = await supabase.rpc("switch_users_active_company", {
      company_id_param: isOpen,
    });
    if (error) {
      alert(error.message);
      return;
    }
    setUser((current: any) => {
      if (current === null) {
        throw new Error("User is null");
      } else {
        return {
          ...current,
          companyId: isOpen,
          companyName: companyName,
        };
      }
    });
    onClose();
    console.log(data);
  }

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-lg w-1/2 flex flex-col justify-center items-center">
        <h1 className="mt-8 text-2xl font-bold">Select Active Company</h1>
        <p className="mt-2">Make {companyName} your active company?</p>
        <div className="mt-8 mb-8">
          <button
            type="button"
            className="mr-2 bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={handleSwitchCompany}
          >
            Activate
          </button>
          <button
            type="button"
            className=" bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwitchCompanyModal;
