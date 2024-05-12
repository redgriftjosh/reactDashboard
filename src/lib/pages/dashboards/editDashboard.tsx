import { useEffect, useState } from "react";
import Sidebar from "../../components/sidebar";
import { CheckIcon } from "@heroicons/react/24/outline";
import { supabase } from "../../helper/supabaseClient";
import { useUserContext } from "../../contexts/userContext";
import { Switch } from "@headlessui/react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Waypoint = {
  waypointId: number;
  waypointName: string;
  orderNum: number;
  date: Date | null;
  enabled: boolean;
};

export default function EditDashboard() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [dashboardName, setDashboardName] = useState<string>("");
  const [dashboardDescription, setDashboardDescription] = useState<string>("");
  const [target, setTarget] = useState(false);
  const [actual, setActual] = useState(false);
  const [status, setStatus] = useState(false);
  const [subHeaders, setSubHeaders] = useState<string[]>([
    "Target",
    "Actual",
    "Status",
  ]);
  const { user } = useUserContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dashboardId = parseInt(searchParams.get("id") ?? "");

  async function getDashboard() {
    const { data, error } = await supabase
      .from("dashboards")
      .select("*")
      .eq("id", dashboardId);
    if (error) {
      alert("An error occurred while fetching dashboard: " + error.message);
      return;
    }
    console.log("getDashboard()", data);

    setDashboardName(data[0].dashboard_name);
    setDashboardDescription(data[0].dashboard_description);
    if (
      data[0].sub_headers.some((subHeader: string | string[]) =>
        subHeader.includes("Target")
      )
    ) {
      setTarget(true);
    }
    if (
      data[0].sub_headers.some((subHeader: string | string[]) =>
        subHeader.includes("Actual")
      )
    ) {
      setActual(true);
    }
    if (
      data[0].sub_headers.some((subHeader: string | string[]) =>
        subHeader.includes("Status")
      )
    ) {
      setStatus(true);
    }
  }

  async function getSelectedWaypoints() {
    const { data, error } = await supabase
      .from("dashboard_waypoints")
      .select("waypoint_id")
      .eq("dashboard_id", dashboardId);

    if (error) {
      alert(
        "An error occurred while fetching selected waypoints: " + error.message
      );
      console.error("Error fetching selected waypoints:", error);
      return;
    }

    return data.map((wp) => wp.waypoint_id);
  }

  async function getWaypoints() {
    const selectedWaypoints = await getSelectedWaypoints();

    const { data, error } = await supabase
      .from("company_waypoints")
      .select("*")
      .eq("company_id", user?.active_company_id)
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
      enabled: selectedWaypoints?.includes(waypoint.id) || false,
    }));
    setWaypoints(transformedData);
  }

  const insertWaypoints = async () => {
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

  const updateDashboard = async () => {
    const { error } = await supabase
      .from("dashboards")
      .update([
        {
          dashboard_name: dashboardName,
          dashboard_description: dashboardDescription,
          sub_headers: subHeaders,
        },
      ])
      .eq("id", dashboardId);
    if (error) {
      alert("An error occurred while inserting dashboard: " + error.message);
      return;
    }

    insertWaypoints();
  };

  const deleteExistingWaypoints = async () => {
    const { error } = await supabase
      .from("dashboard_waypoints")
      .delete()
      .eq("dashboard_id", dashboardId);
    if (error) {
      alert(
        "An error occurred while deleting existing waypoints: " + error.message
      );
      return;
    }
    updateDashboard();
  };

  const handleSubmit = async () => {
    deleteExistingWaypoints();
  };

  useEffect(() => {
    console.log("subHeaders", subHeaders);
  }, [subHeaders]);

  useEffect(() => {
    const tempSubHeaders = [];
    if (target) tempSubHeaders.push("Target");
    if (actual) tempSubHeaders.push("Actual");
    if (status) tempSubHeaders.push("Status");
    setSubHeaders(tempSubHeaders);
  }, [target, actual, status]);

  useEffect(() => {
    getDashboard().then(() => {
      getWaypoints(); // Ensure getWaypoints is called after the dashboard details are fetched
    });
  }, []);

  return (
    <Sidebar selected="Dashboards">
      <div className=" p-8">
        <div className=" w-full">
          <h1 className=" text-4xl font-bold">Edit Dashboard</h1>
          <p className="mb-4">Make changes to your dashboard.</p>
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
              value={dashboardName}
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
              value={dashboardDescription}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              placeholder="A High-Level Overview"
              onChange={(e) => setDashboardDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Select Subheaders */}
        <div className="flex items-center">
          <div className="mb-4 mr-2">
            <label
              htmlFor="dashboardName"
              className="block text-md font-bold text-gray-700"
            >
              Select Columns
            </label>
            <div className="flex items-center">
              <div className="mt-1 w-full border border-gray-300 rounded-md shadow-sm  h-12 px-3 sm:text-md font-bold flex items-center">
                <h2 className="mr-2">Target</h2>
                <Switch
                  checked={target}
                  onChange={() => setTarget(!target)}
                  className={`${target ? "bg-indigo-500" : "bg-gray-200"} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`}
                >
                  <span
                    className={`${target ? "translate-x-6" : "translate-x-1"} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>
              <div className="mt-1 ml-2 w-full border border-gray-300 rounded-md shadow-sm  h-12 px-3 sm:text-md font-bold flex items-center">
                <h2 className="mr-2">Actual</h2>
                <Switch
                  checked={actual}
                  onChange={() => setActual(!actual)}
                  className={`${actual ? "bg-indigo-500" : "bg-gray-200"} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`}
                >
                  <span
                    className={`${actual ? "translate-x-6" : "translate-x-1"} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>
              <div className="mt-1 ml-2 w-full border border-gray-300 rounded-md shadow-sm  h-12 px-3 sm:text-md font-bold flex items-center">
                <h2 className="mr-2">Status</h2>
                <Switch
                  checked={status}
                  onChange={() => setStatus(!status)}
                  className={`${status ? "bg-indigo-500" : "bg-gray-200"} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`}
                >
                  <span
                    className={`${status ? "translate-x-6" : "translate-x-1"} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </Switch>
              </div>
            </div>
          </div>
        </div>

        {/* Waypoint List */}
        <label
          htmlFor="dashboardName"
          className="block text-md font-bold text-gray-700"
        >
          Select Waypoints
        </label>
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
