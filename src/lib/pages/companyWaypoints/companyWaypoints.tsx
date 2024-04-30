import {
  CalendarIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "../../components/sidebar";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../helper/supabaseClient";
import { useUserContext } from "../../contexts/userContext";
import { Reorder } from "framer-motion";
import EditWaypointModal from "./modals/editWaypointModal";

type Waypoint = {
  waypointId: number;
  waypointName: string;
  orderNum: number;
};

export default function CompanyWaypoints() {
  const { user } = useUserContext();
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [newWaypoint, setNewWaypoint] = useState<string>("");
  const [isEditWaypointModalOpen, setIsEditWaypointModalOpen] = useState(false);
  const [editWaypoint, setEditWaypoint] = useState<Waypoint | null>(null);

  const handleOpenEditWaypoint = (waypoint: Waypoint) => {
    setEditWaypoint(waypoint);
    setIsEditWaypointModalOpen(true);
  };

  const handleCloseEditWaypoint = () => {
    setIsEditWaypointModalOpen(false);
  };

  const handleUpdateWaypoint = async (newName: string) => {
    if (editWaypoint) {
      setWaypoints((currentWaypoints) =>
        currentWaypoints.map((wp) =>
          wp.waypointId === editWaypoint.waypointId
            ? { ...wp, waypointName: newName }
            : wp
        )
      );
      console.log("Updating waypoint", editWaypoint.waypointId, newName);

      const { error } = await supabase
        .from("company_waypoints")
        .update({ waypoint_name: newName })
        .eq("id", editWaypoint.waypointId);

      if (error) {
        console.log("error updating waypoint: ", error.message);
      }
    }
    handleCloseEditWaypoint();
  };

  const handleChangeEditWaypoint = (newName: string) => {
    if (editWaypoint) {
      setEditWaypoint({ ...editWaypoint, waypointName: newName });
    }
  };

  // Gotta be real with you, I don't know how this works.
  const handleReorder = async (newWaypoints: Waypoint[]) => {
    const updatedWaypoints = newWaypoints.map((wp, index) => ({
      ...wp,
      orderNum: index,
    }));
    setWaypoints(updatedWaypoints);

    // Then, update the database
    for (const waypoint of updatedWaypoints) {
      const { error } = await supabase
        .from("company_waypoints")
        .update({ order_num: waypoint.orderNum })
        .eq("id", waypoint.waypointId);
      console.log("Updating supabase: ", waypoint);
      if (error) {
        console.error("Error updating waypoint order:", error.message);
        // Optionally handle errors, e.g., rollback local changes or show a message
      }
    }
  };

  async function handleAddWaypoint(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("Adding waypoint");

    const { data, error } = await supabase
      .from("company_waypoints")
      .insert({
        waypoint_name: newWaypoint,
        company_id: user?.companyId,
        order_num: waypoints.length,
      })
      .select();

    if (error) {
      alert("error adding waypoint: " + error.message);
    }

    console.log("handleAddWaypoint", data);

    // Add the new waypoint to the list
    const newWaypointData = {
      waypointId: data && data[0]?.id,
      waypointName: newWaypoint,
      orderNum: data && data[0]?.order_num,
    };
    setWaypoints([...waypoints, newWaypointData]);

    // Set the input to empty?
    setNewWaypoint("");
  }

  async function getCompanyWaypoints() {
    const { data, error } = await supabase
      .from("company_waypoints")
      .select()
      .eq("company_id", user?.companyId)
      .order("order_num", { ascending: true });

    if (error) {
      console.log("error getting company", error.message);
    } else {
      console.log("getCompanyWaypoints", data);
      const transformedData = data.map((waypoint: any) => ({
        waypointId: waypoint.id,
        waypointName: waypoint.waypoint_name,
        orderNum: waypoint.order_num,
      }));
      setWaypoints(transformedData);
    }
  }

  useEffect(() => {
    getCompanyWaypoints();
  }, []);

  return (
    <Sidebar selected={"Company Waypoints"}>
      <div className=" p-8">
        <div className=" w-full">
          <h1 className=" text-4xl font-bold">Company Waypoints</h1>
          <p className="mt-2">
            Define your company's structure. What stages does each job go
            through from start to finish?
          </p>
        </div>

        {/* Waypoints List */}
        <h2 className="mt-8 text-2xl font-bold">Waypoints</h2>
        <Reorder.Group values={waypoints} onReorder={handleReorder}>
          {waypoints.map((waypoint) => (
            <Reorder.Item value={waypoint} key={waypoint.waypointId}>
              <div
                key={waypoint.waypointId}
                className="flex items-center p-2 cursor-grab border rounded-md my-2 hover:shadow-lg hover:my-3 hover:-mx-1 transition-all"
              >
                <CalendarIcon className="h-8, w-8 mr-2" />
                <div className=" w-full">
                  <div className="flex items-center">
                    <h2 className="font-bold">{waypoint.waypointName}</h2>
                    <button onClick={() => handleOpenEditWaypoint(waypoint)}>
                      <PencilSquareIcon className="h-5 w-5 ml-1 text-gray-600 hover:text-indigo-500 hover:h-6 hover:w-6 transition-all" />
                    </button>
                  </div>
                  <h3 className=" text-sm text-slate-500">
                    Index: {waypoint.orderNum}
                  </h3>
                </div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        {editWaypoint && (
          <EditWaypointModal
            waypoint={editWaypoint}
            isOpen={isEditWaypointModalOpen}
            onSave={handleUpdateWaypoint}
            onClose={handleCloseEditWaypoint}
            onChange={handleChangeEditWaypoint}
          />
        )}

        {/* Add New Waypoint */}
        <form onSubmit={handleAddWaypoint}>
          <div className="flex items-center ">
            <button>
              <PlusIcon className="h-10 w-10 mr-2 stroke-indigo-500 hover:stroke-green-500 hover:h-11 hover:w-11 transition-all" />
            </button>
            <input
              type="input-waypoint"
              id="input-waypoint"
              name="input-waypoint"
              className=" block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-12 px-3 sm:text-sm"
              placeholder="Project Started"
              onChange={(e) => setNewWaypoint(e.target.value)}
            />
          </div>
        </form>
      </div>
    </Sidebar>
  );
}
