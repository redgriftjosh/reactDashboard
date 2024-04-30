import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";
import { CheckIcon } from "@heroicons/react/24/outline";
import { supabase } from "../../helper/supabaseClient";
import { useUserContext } from "../../contexts/userContext";
import { Switch } from "@headlessui/react";
import { useNavigate } from "react-router-dom";

type Waypoint = {
  waypointId: number;
  waypointName: string;
  orderNum: number;
  date: Date | null;
  enabled: boolean;
};

export default function AddDashboard() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [dashboardName, setDashboardName] = useState<string>("");
  const [dashboardDescription, setDashboardDescription] = useState<string>("");
  // const [enabled, setEnabled] = useState(false);
  const { user } = useUserContext();
  const navigate = useNavigate();

  async function getWaypoints() {
    const { data, error } = await supabase
      .from("company_waypoints")
      .select("*")
      .eq("company_id", user?.companyId)
      .order("order_num");
    if (error) {
      alert("An error occurred while fetching waypoints: " + error.message);
      return;
    }

    const transformedData = data.map((waypoint: any) => ({
      waypointId: waypoint.id,
      waypointName: waypoint.waypoint_name,
      orderNum: waypoint.order_num,
      date: null,
      enabled: false,
    }));
    setWaypoints(transformedData);
  }

  const insertWaypoints = async (dashboardId: number) => {
    const enabledWaypoints = waypoints.filter((wp) => wp.enabled);

    const { error } = await supabase.from("dashboard_waypoints").insert(
      enabledWaypoints.map((wp) => ({
        dashboard_id: dashboardId,
        waypoint_id: wp.waypointId,
      }))
    );
    if (error) {
      alert("An error occurred while inserting waypoints: " + error.message);
      return;
    }
    navigate("/dashboards");
  };

  const insertDashboard = async () => {
    const { data, error } = await supabase
      .from("dashboards")
      .insert([
        {
          dashboard_name: dashboardName,
          dashboard_description: dashboardDescription,
          company_id: user?.companyId,
        },
      ])
      .select();
    if (error) {
      alert("An error occurred while inserting dashboard: " + error.message);
      return;
    }

    insertWaypoints(data[0].id);
  };

  const handleSubmit = async () => {
    insertDashboard();
  };

  useEffect(() => {
    getWaypoints();
  }, []);

  return (
    <Sidebar selected="Dashboards">
      <div className=" p-8">
        <div className=" w-full">
          <h1 className=" text-4xl font-bold">Create a New Dashboard</h1>
          <p className="mb-4">Configure your new dashboard.</p>
        </div>

        {/* Dashboard Name & Description */}
        <div className="flex items-baseline">
          <div className="mb-4 w-1/4 mr-2">
            <label
              htmlFor="dashboardName"
              className="block text-md font-bold text-gray-700"
            >
              Dashboard Name
            </label>
            <input
              type="text"
              id="dashboardName"
              name="dashboardName"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-md font-bold"
              placeholder="My Dashboard"
              onChange={(e) => setDashboardName(e.target.value)}
            />
          </div>
          <div className="mb-4 w-3/4 ml-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              placeholder="A High-Level Overview"
              onChange={(e) => setDashboardDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Waypoint List */}
        {waypoints.map((waypoint) => (
          <div
            key={waypoint.waypointId}
            className="flex items-center p-2 border rounded-md my-2"
          >
            <h2 className="font-bold mr-2">{waypoint.waypointName}</h2>
            <Switch
              checked={waypoint.enabled}
              onChange={() => {
                setWaypoints(
                  waypoints.map((wp) => {
                    if (wp.waypointId === waypoint.waypointId) {
                      return { ...wp, enabled: !wp.enabled };
                    }
                    return wp;
                  })
                );
              }}
              className={`${waypoint.enabled ? "bg-indigo-500" : "bg-gray-200"}
          relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`}
            >
              <span
                className={`${waypoint.enabled ? "translate-x-6" : "translate-x-1"}
            inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
              />
            </Switch>
          </div>
        ))}

        {/* Save Button */}
        <div
          onClick={handleSubmit}
          className="items-center cursor-pointer mt-4 bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 inline-flex"
        >
          <CheckIcon className="h-5 w-5 mr-2 stroke-white " />
          <div>Save</div>
        </div>
      </div>
    </Sidebar>
  );
}
