import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import { useUserContext } from "../../contexts/userContext";
import { supabase } from "../../helper/supabaseClient";
import ProfileIcon from "../../../assets/profileIcon.svg";
import {
  PencilSquareIcon,
  UserGroupIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import EditNameModal from "./modals/editNameModal";
import { useEffect, useState } from "react";
import CreateCompanyModal from "./modals/createCompanyModal";
import SwitchCompanyModal from "./modals/switchCompanyModal";
import { useAuthContext } from "../../contexts/authContext";

export default function Profile() {
  const { user } = useUserContext();
  const { setToken } = useAuthContext();
  const navigate = useNavigate();

  const [isModalOpen, setModalOpen] = useState(false); // This is for the edit name modal
  const [isCompanyModalOpen, setCompanyModalOpen] = useState(false); // This is for the create company modal
  const [switchCompanyModal, setSwitchCompanyModal] = useState<number | null>(
    null
  );
  const [switchCompanyName, setSwitchCompanyName] = useState<string>("");

  type Company = {
    id: number; // Using an ID for key purposes
    name: string;
    role?: string;
  };

  const [companies, setCompanies] = useState<Company[]>();

  // This is handling the log out
  const handleLogOut = async () => {
    const { error } = await supabase.auth.signOut();
    sessionStorage.removeItem("token");
    if (error) {
      console.log("Error logging out:", error.message);
      return;
    }
    setToken(false);
    navigate("/login");
  };

  // Edit Name Modal
  const handleOpenEditName = (event: React.MouseEvent) => {
    setModalOpen(true);
    event.stopPropagation();
  };
  const handleCloseEditName = () => setModalOpen(false);

  // Create Company Modal
  const handleOpenCreateCompany = () => setCompanyModalOpen(true);
  const handleCloseCreateCompany = () => {
    setCompanyModalOpen(false);
  };
  function handleSetCompanies() {
    getUserCompanies();
  }

  // Switch Company Modal
  const handleOpenSwitchCompanyModal = (id: number, name: string) => {
    setSwitchCompanyModal(id);
    setSwitchCompanyName(name);
  };
  const handleCloseSwitchCompanyModal = () => setSwitchCompanyModal(null);

  async function getUserCompanies() {
    const { data, error } = await supabase.rpc("get_user_companies", {
      user_id_param: user?.id,
    });
    if (error) {
      console.log("Error getUserCompanies", error.message);
      return;
    }

    if (data) {
      console.log("data", data);
      console.log("user?.id", user?.id);
      const transformedData = data.map((company: any) => ({
        id: company.company_id,
        name: company.company_name,
        role: company.role_name,
      }));
      setCompanies(transformedData);
      // console.log("companies", companies);
    }
  }

  useEffect(() => {
    // getCompanies();
    getUserCompanies();
  }, []);

  const listCompanyClass =
    "flex items-center p-2 cursor-pointer border rounded-md my-2 hover:shadow-lg hover:my-3 hover:-mx-1 transition-all";

  return (
    <Sidebar>
      <div className=" p-8">
        <div className=" flex items-center">
          <img src={ProfileIcon} alt="Profile" className="h-20 w-20 mr-2" />
          <div className="py-0">
            <div className="flex items-center space-x-2">
              <span className="block font-semibold text-lg">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                // Define this function to handle the click event
                type="button"
                className="p-1 rounded-full hover:bg-gray-200" // TailwindCSS for styling
                aria-label="Edit Name" // Accessibility label
                onClick={handleOpenEditName}
              >
                <PencilSquareIcon className="h-5 w-5 text-gray-600" />
              </button>
              <EditNameModal
                isOpen={isModalOpen}
                onClose={handleCloseEditName}
              />
            </div>
            <span className="block text-gray-600 font-semibold text-sm">
              {user?.email}
            </span>
          </div>
        </div>
        <div className="text-center">
          <CreateCompanyModal
            isOpen={isCompanyModalOpen}
            onClose={handleCloseCreateCompany}
            addCompany={handleSetCompanies}
          />
        </div>

        {/* Active Company */}
        <div>
          <h2 className="mt-8 text-2xl font-bold">Active Company</h2>
          {user?.companyName ? (
            <div
              className={listCompanyClass}
              onClick={() => navigate(`/edit-company?id=${user?.companyId}`)}
            >
              <CheckIcon className="h-10, w-10 mr-2 stroke-green-500" />
              <div className=" w-full">
                <h2 className="font-bold">{user?.companyName}</h2>
                <h3 className=" text-sm text-slate-500">No Role</h3>
              </div>
            </div>
          ) : (
            <div className="flex items-center p-2 cursor-pointer border rounded-md my-2">
              <XMarkIcon className="h-10, w-10 mr-2" />
              <div className=" w-full">
                <h2 className="font-bold">No Active Company</h2>
                <h3 className=" text-sm text-slate-500">
                  Create a New Company or get invited to an existing one.
                </h3>
              </div>
            </div>
          )}
        </div>
        <h2 className="mt-8 text-2xl font-bold">Available Companies</h2>
        <SwitchCompanyModal
          isOpen={switchCompanyModal}
          companyName={switchCompanyName}
          onClose={handleCloseSwitchCompanyModal}
        />

        {/* List of Available companies */}
        <div>
          {companies?.map((company) => (
            <div
              key={company.id}
              className={listCompanyClass}
              onClick={() =>
                handleOpenSwitchCompanyModal(company.id, company.name)
              }
            >
              <UserGroupIcon className="h-10, w-10 mr-2" />
              <div className=" w-full">
                <h2 className="font-bold">{company.name}</h2>
                <h3 className=" text-sm text-slate-500">
                  {company.role ? company.role : "No Role"}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Create New Company Button */}
        <div className={listCompanyClass} onClick={handleOpenCreateCompany}>
          <PlusIcon className="h-10, w-10 mr-2 stroke-indigo-500" />
          <div className=" w-full">
            <h2 className="font-bold">Create a New Company</h2>
          </div>
        </div>

        {/* Log Out Button */}
        <button
          type="button"
          className="mt-8 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={handleLogOut}
        >
          Log Out
        </button>
      </div>
    </Sidebar>
  );
}
