import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";
import {
  PencilSquareIcon,
  PlusIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../helper/supabaseClient";
import { useUserContext } from "../../contexts/userContext";

type Dashboard = {
  id: number; // Using an ID for key purposes
  name: string;
  description: string;
};
export default function Dashboards() {
  const [dashboards, setDashboards] = useState<Dashboard[]>();
  const navigate = useNavigate();
  const { user } = useUserContext();

  const getDashboards = async () => {
    const { data, error } = await supabase
      .from("dashboards")
      .select()
      .eq("company_id", user?.active_company_id);
    if (error) {
      alert("An error occurred while fetching dashboards: " + error.message);
      return;
    }
    const transformedData = data.map((dashboard: any) => ({
      id: dashboard.id,
      name: dashboard.dashboard_name,
      description: dashboard.dashboard_description,
    }));
    setDashboards(transformedData);
  };

  const handleEditDashboard = (
    id: number,
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    navigate(`/edit-dashboard?id=${id}`);
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    getDashboards();
  }, []);

  return (
    <Sidebar selected="Dashboards">
      <div className=" p-8">
        <div className=" w-full">
          <h1 className=" text-4xl font-bold">Dashboards</h1>
          <p className="mb-4">Create different ways to display your data.</p>
        </div>

        {/* List of Dashboards */}
        {dashboards?.map((dashboard) => (
          <a
            // For opening in a new tab
            key={dashboard.id}
            href={`/view-dashboard?id=${dashboard.id}`}
            // target="_blank" // Uncomment this line to open in a new tab
            rel="noopener noreferrer"
          >
            <div className="flex items-center p-2 cursor-pointer border rounded-md my-2 hover:shadow-lg hover:my-3 hover:-mx-1 transition-all">
              <Squares2X2Icon className="h-10, w-10 mr-2" />
              <div className=" w-full">
                <div className="flex items-center">
                  <h2 className="font-bold">{dashboard.name}</h2>
                  <button
                    onClick={(event) =>
                      handleEditDashboard(dashboard.id, event)
                    }
                  >
                    <PencilSquareIcon className="h-5 w-5 ml-1 text-gray-600 hover:text-indigo-500 hover:h-6 hover:w-6 transition-all" />
                  </button>
                </div>
                <h3 className=" text-sm text-slate-500">
                  {dashboard.description}
                </h3>
              </div>
            </div>
          </a>
        ))}

        {/* Create New Company Button */}
        <div
          className="flex items-center p-2 cursor-pointer border rounded-md my-2 hover:shadow-lg hover:my-3 hover:-mx-1 transition-all"
          onClick={() => navigate(`/add-dashboard`)}
        >
          <PlusIcon className="h-10, w-10 mr-2 stroke-indigo-500" />
          <div className=" w-full">
            <h2 className="font-bold">Create a New Dashboard</h2>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
