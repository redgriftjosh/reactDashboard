import { CheckIcon } from "@heroicons/react/24/outline";
import Sidebar from "../../components/sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useEffect, useState } from "react";
import { supabase } from "../../helper/supabaseClient";
import { useUserContext } from "../../contexts/userContext";
import { useNavigate } from "react-router-dom";
import { calculateStatus } from "../../helper/calculateStatus";

type Waypoint = {
  jobWaypointId: number | null;
  waypointId: number;
  waypointName: string;
  orderNum: number;
  targetCompletion: Date | null;
  actualCompletion: Date | null;
  status: string;
};

export default function AddJob() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [jobName, setJobName] = useState<string>("");
  const { user } = useUserContext();
  const navigate = useNavigate();

  const [dateChange, setDateChange] = useState(0);

  const findPreviousStatus = (
    myWaypoints: Waypoint[],
    currentIndex: number
  ) => {
    for (let i = currentIndex; i > 0; i--) {
      if (myWaypoints[i - 1].status !== "Undefined") {
        // Ensure status is not empty or undefined
        return myWaypoints[i - 1].status;
      }
    }
    return "Undefined"; // Return "undefined" if no previous status is found
  };

  const updateStatuses = (myWaypoints: Waypoint[]) => {
    const updatedWaypoints = myWaypoints.map((waypoint, index) => {
      const prevStatus = findPreviousStatus(myWaypoints, index);
      const status = calculateStatus({
        targetCompletionDate: waypoint.targetCompletion
          ? new Date(waypoint.targetCompletion)
          : null,
        actualCompletionDate: waypoint.actualCompletion
          ? new Date(waypoint.actualCompletion)
          : null,
        previousWaypointStatus: prevStatus,
      });
      waypoint.status = status;
      return { ...waypoint, status };
      console.log(" ");
      console.log("updateStatuses: ", waypoint.waypointName);
      console.log("targetCompletionDate: ", waypoint.targetCompletion);
      console.log("actualCompletionDate: ", waypoint.actualCompletion);
      console.log("previousWaypointStatus: ", myWaypoints[index - 1]?.status);
      console.log("calculateStatus: ", status);
    });

    setWaypoints(updatedWaypoints);
  };

  const handleTargetDateChange = (waypointId: number, date: Date | null) => {
    setWaypoints((currentWaypoints) =>
      currentWaypoints.map((wp) =>
        wp.waypointId === waypointId
          ? {
              ...wp,
              targetCompletion: date,
            }
          : wp
      )
    );
    setDateChange(dateChange + 1);
  };

  const handleActualDateChange = (waypointId: number, date: Date | null) => {
    setWaypoints((currentWaypoints) =>
      currentWaypoints.map((wp) =>
        wp.waypointId === waypointId
          ? {
              ...wp,
              actualCompletion: date,
            }
          : wp
      )
    );
    setDateChange(dateChange + 1);
  };

  const insertJobWaypoints = async (jobId: number) => {
    // Prepare batch operations
    const operations = waypoints.map((waypoint) => {
      return supabase.from("job_waypoints").insert({
        job_id: jobId,
        waypoint_id: waypoint.waypointId,
        target_completion: waypoint.targetCompletion,
        actual_completion: waypoint.actualCompletion,
        status: waypoint.status,
      });
    });

    // Execute all operations
    try {
      await Promise.all(operations);
      console.log("All waypoints updated or inserted successfully.");
    } catch (error: unknown) {
      console.error("Error updating waypoints:", error);
      alert("An error occurred while updating waypoints: " + error);
    }
  };

  const handleSave = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .insert({ job_name: jobName, company_id: user?.active_company_id })
      .select();
    if (error) {
      alert("An error occurred while saving the job: " + error.message);
      return;
    }
    insertJobWaypoints(data[0].id);
    navigate("/jobs");
  };

  // Gets the company waypoints in case they've changed since the user created this job
  async function getCompanyWaypoints() {
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
      jobWaypointId: null,
      waypointId: waypoint.id,
      waypointName: waypoint.waypoint_name,
      orderNum: waypoint.order_num,
      targetCompletion: null,
      actualCompletion: null,
      status: "",
    }));
    setWaypoints(transformedData);
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "At Risk":
        return "bg-yellow-200 text-yellow-600"; // Yellow for at risk
      case "In Progress":
        return "bg-blue-200 text-blue-600"; // Blue for in progress
      case "LATE":
        return "bg-red-200 text-red-600"; // Red for late
      case "Done Late":
        return "bg-green-200 text-green-600"; // Darker red for done late
      case "Done":
        return "bg-green-200 text-green-600"; // Green for done
      default:
        return "bg-gray-200 text-gray-600"; // Default gray
    }
  };

  useEffect(() => {
    updateStatuses(waypoints);
    console.log("useEffect-[dateChange] running: ", waypoints);
  }, [dateChange]);

  useEffect(() => {
    getCompanyWaypoints(); // Lists all the company waypoints that the user defined in the company waypoints tab.
  }, []);

  return (
    <Sidebar selected={"Jobs"}>
      <div className=" p-8">
        <div className=" w-full">
          <h1 className=" text-4xl font-bold">Add a Job</h1>
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
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
            />
          </div>
        </div>

        {/* Waypoint List */}
        {waypoints.map((waypoint) => (
          <div className="p-2 border rounded-md my-2" key={waypoint.waypointId}>
            <h1 className="font-bold text-2xl">{waypoint.waypointName}</h1>
            <div className="flex items-center mb-2">
              <h2 className=" mr-2 whitespace-nowrap">Target Completion</h2>
              <div className="w-full">
                <DatePicker
                  className="border rounded-md p-2 w-full"
                  selected={waypoint.targetCompletion}
                  onChange={(date: Date | null) =>
                    handleTargetDateChange(waypoint.waypointId, date)
                  }
                  wrapperClassName="w-full"
                  isClearable={true}
                  showMonthDropdown={true}
                  dateFormat="MMM dd, yyyy"
                />
              </div>
            </div>
            <div className="flex items-center mb-2">
              <h2 className=" mr-2 whitespace-nowrap">Actual Completion</h2>
              <div className="w-full">
                <DatePicker
                  className="border rounded-md p-2 w-full"
                  selected={waypoint.actualCompletion}
                  onChange={(date: Date | null) =>
                    handleActualDateChange(waypoint.waypointId, date)
                  }
                  wrapperClassName="w-full"
                  isClearable={true}
                  showMonthDropdown={true}
                  dateFormat="MMM dd, yyyy"
                />
              </div>
            </div>
            <div className="flex items-center">
              <h2 className=" mr-2 whitespace-nowrap">Status</h2>
              <div
                className={`rounded-md p-2 w-full ${statusColor(waypoint.status)}`}
              >
                <h2 className=" mr-2 whitespace-nowrap text-center">
                  {waypoint.status}
                </h2>
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
