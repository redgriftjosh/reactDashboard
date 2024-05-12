import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/sidebar";
import { useEffect, useState } from "react";
import { useUserContext } from "../../contexts/userContext";
import { supabase } from "../../helper/supabaseClient";
import ProfileIcon from "../../../assets/profileIcon.svg";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import InviteTeamMemberModal from "./modals/inviteTeamMemberModal";
import { useCompanyContext } from "../../contexts/companyContext";
import DeleteCompanyModal from "./modals/deleteCompanyModal";

type Teammate = {
  teammateId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

export default function EditCompany() {
  const [searchParams] = useSearchParams();
  const companyId = parseInt(searchParams.get("id") ?? "");
  const navigate = useNavigate();
  const { user } = useUserContext();
  const { company } = useCompanyContext();
  const [teammates, setTeammates] = useState<Teammate[]>();
  const [isInviteTeamMemberModalOpen, setInviteTeamMemberModalOpen] =
    useState(false); // This is for the invite team member modal

  const [isDeleteCompanyModalOpen, setDeleteCompanyModalOpen] = useState(false);

  async function getUsers() {
    const { data, error } = await supabase.rpc("get_company_users", {
      company_id_param: companyId,
    });
    if (error) {
      console.error("Error getting users", error.message);
      return;
    }

    console.log("getUsers()", data);
    const transformedData = data.map((teammate: any) => ({
      teammateId: teammate.teammate_id,
      firstName: teammate.first_name,
      lastName: teammate.last_name,
      email: teammate.email,
      role: teammate.role_name,
    }));
    setTeammates(transformedData);
    console.log("teammates", teammates);
  }

  const handleCloseCreateCompany = () => setDeleteCompanyModalOpen(false);

  const handleOpenInviteTeamMember = () => {
    setInviteTeamMemberModalOpen(true);
  };

  useEffect(() => {
    if (companyId !== user?.active_company_id) {
      console.log("You can't edit this company");
      navigate("/profile");
    }

    getUsers();
  }, [isInviteTeamMemberModalOpen]);

  if (!user) return;
  return (
    <Sidebar>
      <div className=" p-8">
        <div className="flex">
          <div className="w-full">
            <h2 className=" text-4xl font-bold">{company?.company_name}</h2>
            <p>Edit company</p>
          </div>
          <button
            // Define this function to handle the click event
            type="button" // TailwindCSS for styling
            aria-label="Edit Name" // Accessibility label
            onClick={() => navigate("/profile")}
          >
            <XMarkIcon className="h-10 w-10 text-gray-600 hover:animate-pulse hover:text-black transition-all" />
          </button>
        </div>
        <h2 className="mt-8 text-2xl font-bold">Company Members</h2>
        {/* Trying to exclud my own id...  */}
        {teammates?.map((teammate) => (
          <div
            key={teammate.teammateId}
            className="flex items-center p-2 border rounded-md my-2"
          >
            <img src={ProfileIcon} alt="Profile" className="h-10 w-10 mr-2" />
            <div className=" w-full">
              <h2 className="font-bold">
                {teammate.firstName ?? `Account Pending: ${teammate.email}`}
              </h2>
              <h3 className=" text-sm text-slate-500">{teammate.role}</h3>
            </div>
          </div>
        ))}

        {/* Invite Team Member Button */}
        <div
          className="flex items-center p-2 cursor-pointer border rounded-md my-2 hover:shadow-lg hover:my-3 hover:-mx-1 transition-all"
          onClick={handleOpenInviteTeamMember}
        >
          <PlusIcon className="h-10, w-10 mr-2 stroke-indigo-500" />
          <div className=" w-full">
            <h2 className="font-bold">Invite Team Members</h2>
          </div>
        </div>
        <InviteTeamMemberModal
          isOpen={isInviteTeamMemberModalOpen}
          onClose={() => setInviteTeamMemberModalOpen(false)}
        />

        {/* Delete Company Button */}
        <button
          type="button"
          className="mt-8 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          onClick={() => setDeleteCompanyModalOpen(true)}
        >
          Permanently Delete Company
        </button>
        <DeleteCompanyModal
          isOpen={isDeleteCompanyModalOpen}
          onClose={handleCloseCreateCompany}
        />
      </div>
    </Sidebar>
  );
}
