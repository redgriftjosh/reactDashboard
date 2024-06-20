import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../helper/supabaseClient";
import { useUserContext } from "../../contexts/userContext";
import { calculateStatus } from "../../helper/calculateStatus";

type Waypoint = {
  id: number;
  name: string;
  status: string;
  targetCompletion: Date | null;
  actualCompletion: Date | null;
  values: string[];
};

// type Waypoint = {
//   jobWaypointId: number | null;
//   waypointId: number;
//   waypointName: string;
//   orderNum: number;
//   targetCompletion: Date | null;
//   actualCompletion: Date | null;
//   status: string;
// };

type Job = {
  id: number;
  name: string;
  waypoints: Waypoint[];
};

export default function ViewDashboard1() {
  const [searchParams] = useSearchParams();
  const dashboardId = parseInt(searchParams.get("id") ?? "");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [subHeaders, setSubHeaders] = useState<string[]>([]);
  const { user } = useUserContext();
  const [dashboardName, setDashboardName] = useState<string>("");
  // let subHeaders: string[] = [];
  const navigate = useNavigate();

  // Mock data for the table
  // const headers = ["Waypoint One", "Waypoint Two"];

  // const subHeaders = ["Status"];

  // const jobs = [
  //   {
  //     id: 1,
  //     name: "Job One",
  //     waypoints: [
  //       {
  //         id: 1,
  //         name: "Waypoint One",
  //         targetCompletion: "10/10/2021",
  //         actualCompletion: "10/10/2021",
  //         status: "Complete",
  //       },
  //       {
  //         id: 2,
  //         name: "Waypoint Two",
  //         targetCompletion: "10/10/2021",
  //         actualCompletion: "10/10/2021",
  //         status: "Complete",
  //       },
  //     ],
  //   },
  //   {
  //     id: 2,
  //     name: "Job Two",
  //     waypoints: [
  //       {
  //         id: 1,
  //         name: "Waypoint One",
  //         targetCompletion: "10/10/2021",
  //         actualCompletion: "10/10/2021",
  //         status: "Complete",
  //       },
  //       {
  //         id: 2,
  //         name: "Waypoint Two",
  //         targetCompletion: "10/10/2021",
  //         actualCompletion: "10/10/2021",
  //         status: "Complete",
  //       },
  //     ],
  //   },
  // ];

  const getDashboardWaypoints = async () => {
    const { data, error } = await supabase
      .from("dashboard_waypoints")
      .select("*")
      .eq("dashboard_id", dashboardId);
    if (error) {
      alert("An error occurred in getDashboardWaypoints: " + error.message);
      return;
    }

    return data.map((item) => item.waypoint_id);
  };

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

  const assignValues = async (jobs: Job[], subHeaders: string[]) => {
    // Fetch data for all jobs at once if possible, or individually if necessary
    // console.log("assignValues - subHeaders", subHeaders);
    const promises = jobs.map(async (job) => {
      const { data, error } = await supabase
        .from("job_waypoints")
        .select("*")
        .eq("job_id", job.id);
      if (error) {
        console.error("An error occurred in assignValues:", error.message);
        return job; // return job unmodified if there's an error
      }

      console.log("assignValues - data", data);

      // map through each job's waypoints and assign values
      const updatedWaypoints = job.waypoints.map(
        (waypoint: Waypoint, index) => {
          const waypointData = data.find((w) => w.waypoint_id === waypoint.id);

          const prevStatus = findPreviousStatus(job.waypoints, index);

          const status = calculateStatus({
            targetCompletionDate: waypointData.target_completion
              ? new Date(waypointData.target_completion)
              : null,
            actualCompletionDate: waypointData.actual_completion
              ? new Date(waypointData.actual_completion)
              : null,
            previousWaypointStatus: prevStatus,
          });
          waypoint.status = status;
          const hasSubHeader = (header: string) => subHeaders?.includes(header);
          if (waypointData) {
            const tempValues = [];
            if (hasSubHeader("Target")) {
              tempValues.push(waypointData.target_completion ?? "");
            }
            if (hasSubHeader("Actual")) {
              tempValues.push(waypointData.actual_completion ?? "");
            }
            if (hasSubHeader("Status")) {
              tempValues.push(status);
            }
            return {
              ...waypoint,

              values: tempValues,
            };
          } else {
            // Handle the case where no data was found
            return {
              ...waypoint,
              values: ["Undefined", "Undefined", "Undefined"],
            };
          }
        }
      );

      return { ...job, waypoints: updatedWaypoints };
    });

    const updatedJobs = await Promise.all(promises);
    setJobs(updatedJobs); // Update the jobs state with all the new data

    // console.log("assignValues: ", jobs);
  };

  const getJobs = async (waypoints: Waypoint[], subHeaders: string[]) => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", user?.active_company_id)
      .order("id");
    if (error) {
      alert("An error occurred in getJobs: " + error.message);
      return;
    }

    // build jobs array with each job containing an array of waypoints
    const transformedData = data.map((job: any) => ({
      id: job.id,
      name: job.job_name,
      waypoints: waypoints.map((waypoint) => ({
        id: waypoint.id,
        name: waypoint.name,
        status: waypoint.status,
        targetCompletion: waypoint.targetCompletion,
        actualCompletion: waypoint.actualCompletion,
        values: [],
      })),
    }));
    // console.log("getJobs: ", transformedData);
    setJobs(transformedData);
    assignValues(transformedData, subHeaders);
  };

  const getCompanyWaypoints = async (subHeaders: string[]) => {
    const { data, error } = await supabase
      .from("company_waypoints")
      .select("*")
      .eq("company_id", user?.active_company_id)
      .order("order_num");
    if (error) {
      alert("An error occurred in getCompanyWaypoints: " + error.message);
      return;
    }
    // console.log("getCompanyWaypoints - data", data);

    // Await the dashboard waypoint ids to ensure they are loaded before filtering
    const waypoint_ids = await getDashboardWaypoints(); // out of order waypoint ids
    // console.log("dashboard_waypoints", waypoint_ids);

    // Filter the company waypoints to only include those in the dashboard
    const transformedData = data
      .filter((waypoint) => waypoint_ids?.includes(waypoint.id))
      .map((waypoint) => ({
        id: waypoint.id,
        name: waypoint.waypoint_name,
        status: "Undefined",
        targetCompletion: null,
        actualCompletion: null,
        values: ["", ""],
      }));
    // console.log("transformedData", transformedData);
    setHeaders(transformedData.map((waypoint) => waypoint.name));
    getJobs(transformedData, subHeaders);
  };

  const getDashboard = async () => {
    const { data, error } = await supabase
      .from("dashboards")
      .select("*")
      .eq("id", dashboardId);
    if (error) {
      alert("An error occurred in getDashboardName: " + error.message);
      return;
    }
    // console.log("getDashboard - data[0]", data[0]);
    setDashboardName(data[0].dashboard_name);
    // const subHeaders = data[0].sub_headers;
    getCompanyWaypoints(data[0].sub_headers);
    setSubHeaders(data[0].sub_headers);
  };

  // Pulling these colours directly from customStyles.css
  const statusColor = (status: string) => {
    switch (status) {
      case "At Risk":
        return "bg-yellow-custom text-yellow-custom"; // Yellow for at risk
      case "In Progress":
        return "bg-blue-custom text-blue-custom"; // Blue for in progress
      case "LATE":
        return "bg-red-custom text-red-custom"; // Red for late
      case "Done Late":
        return "bg-green-custom text-green-custom"; // Darker red for done late
      case "Done":
        return "bg-green-custom text-green-custom"; // Green for done
      case "Undefined":
        return "bg-gray-custom text-gray-custom";
      default:
        return ""; // Default gray
    }
  };

  const handleDatabaseChange = () => {
    getDashboard();
    // getCompanyWaypoints();
  };

  useEffect(() => {
    getDashboard();
    // getCompanyWaypoints();

    const subscription = supabase
      .channel("dashboard_waypoints")
      .on("postgres_changes", { event: "*", schema: "*" }, () => {
        handleDatabaseChange();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div>
      <table className="w-full">
        <tbody>
          {/* Main Header */}
          <tr>
            <td className="border p-1 font-bold text-2xl whitespace-nowrap custom-table-border">
              {dashboardName}
            </td>
            {headers.map((header, index) => (
              <td
                key={index}
                colSpan={subHeaders.length}
                className="border p-1 font-bold text-2xl whitespace-nowrap custom-table-border"
              >
                {header}
              </td>
            ))}
          </tr>
          {/* Subheaders */}
          <tr>
            <td className="border p-1 font-bold whitespace-nowrap custom-table-border">
              Job Name
            </td>
            {headers.map(() =>
              subHeaders.map((subHeader, index) => (
                <td
                  key={index}
                  className="border p-1 font-bold whitespace-nowrap custom-table-border"
                >
                  {subHeader}
                </td>
              ))
            )}
          </tr>
          {/* Rows */}
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => navigate(`/edit-job?id=${job.id}`)}
              className="cursor-pointer hover:bg-gray-100 transition-all"
            >
              <td className="border p-1 font-bold whitespace-nowrap custom-table-border">
                {job.name}
              </td>
              {job.waypoints.map((waypoint) =>
                waypoint.values.map((value, index) => (
                  <td
                    key={index}
                    className={`border px-2 whitespace-nowrap ${statusColor(value)} custom-table-border`}
                  >
                    {value}
                  </td>
                ))
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
