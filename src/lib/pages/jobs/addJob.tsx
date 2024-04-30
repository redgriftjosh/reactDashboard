import { CheckIcon } from "@heroicons/react/24/outline";
import Sidebar from "../../components/sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useEffect, useState } from "react";
import { supabase } from "../../helper/supabaseClient";
import { useUserContext } from "../../contexts/userContext";
import { useNavigate } from "react-router-dom";

type Waypoint = {
  waypointId: number;
  waypointName: string;
  orderNum: number;
  date: Date | null;
};

export default function AddJob() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [jobName, setJobName] = useState<string>("");
  const { user } = useUserContext();
  const navigate = useNavigate();

  const handleDateChange = (waypointId: number, date: Date | null) => {
    setWaypoints((currentWaypoints) =>
      currentWaypoints.map((wp) =>
        wp.waypointId === waypointId ? { ...wp, date: date } : wp
      )
    );
  };

  const createJobWaypoints = async (jobId: number) => {
    const waypointsToInsert = waypoints.map((waypoint) => ({
      job_id: jobId,
      target_completion: waypoint.date,
      waypoint_id: waypoint.waypointId,
    }));

    const { error } = await supabase
      .from("job_waypoints")
      .insert(waypointsToInsert);
    if (error) {
      alert(
        "An error occurred while saving the job waypoints: " + error.message
      );
      return;
    }
  };

  const handleSave = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .insert({ company_id: user?.companyId, job_name: jobName })
      .select();
    if (error) {
      alert("An error occurred while saving the job: " + error.message);
      return;
    }
    createJobWaypoints(data[0].id);
    navigate("/jobs");
  };

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
    }));
    setWaypoints(transformedData);
  }

  useEffect(() => {
    getWaypoints();
  }, []);

  return (
    <Sidebar selected={"Jobs"}>
      <div className=" p-8">
        <div className=" text-center">
          <h1 className=" text-4xl font-bold">Add Job</h1>
          <p className="mb-4">Define the target dates for each waypoint.</p>
        </div>

        {/* Job Name */}
        <div className="flex items-center p-2  rounded-md my-2 justify-center">
          <h2 className="font-bold mr-2">Job Name</h2>
          <div>
            <input
              type="text"
              className="border rounded-md p-2"
              placeholder="Enter Job Name"
              onChange={(e) => setJobName(e.target.value)}
            />
          </div>
        </div>

        {/* Waypoint List */}
        {waypoints.map((waypoint) => (
          <div
            key={waypoint.waypointId}
            className="flex items-center p-2 border rounded-md my-2 justify-center"
          >
            <h2 className="font-bold mr-2">{waypoint.waypointName}</h2>
            <div>
              <div className=" border inline-flex items-center">
                <DatePicker
                  selected={waypoint.date}
                  onChange={(date: Date | null) =>
                    handleDateChange(waypoint.waypointId, date)
                  }
                  isClearable={true}
                  showMonthDropdown={true}
                  dateFormat="MMM dd, yyyy"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Save Button */}
        <div className="flex justify-center">
          <div
            onClick={handleSave}
            className="items-center cursor-pointer mt-4 bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 inline-flex"
          >
            <CheckIcon className="h-5 w-5 mr-2 stroke-white " />
            <div>Save</div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
