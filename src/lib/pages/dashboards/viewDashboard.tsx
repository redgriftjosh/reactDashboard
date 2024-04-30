import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../helper/supabaseClient";
import { useUserContext } from "../../contexts/userContext";

type Waypoint = {
  id: number;
  name: string;
  values: string[];
};

type Job = {
  id: number;
  name: string;
  waypoints: Waypoint[];
};

export default function ViewDashboard() {
  const [searchParams] = useSearchParams();
  const dashboardId = parseInt(searchParams.get("id") ?? "");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  // const [subHeaders, setSubHeaders] = useState<string[]>([]);
  const { user } = useUserContext();
  const [dashboardName, setDashboardName] = useState<string>("");
  const navigate = useNavigate();

  // Mock data for the table
  // const headers = ["Waypoint One", "Waypoint Two"];

  const subHeaders = ["Target Completion", "Actual Completion", "Status"];

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
      .select("waypoint_id")
      .eq("dashboard_id", dashboardId);
    if (error) {
      alert("An error occurred in getDashboardWaypoints: " + error.message);
      return;
    }

    return data.map((item) => item.waypoint_id);
  };

  const assignValues = async (jobs: Job[]) => {
    // Fetch data for all jobs at once if possible, or individually if necessary
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
      const updatedWaypoints = job.waypoints.map((waypoint: any) => {
        const waypointData = data.find((w) => w.waypoint_id === waypoint.id);
        if (waypointData) {
          return {
            ...waypoint,
            values: [
              waypointData.target_completion ?? "Undefined",
              waypointData.actual_completion ?? "Undefined",
              "Status",
            ],
          };
        } else {
          // Handle the case where no data was found
          return {
            ...waypoint,
            values: ["Undefined", "Undefined", "Undefined"],
          };
        }
      });

      return { ...job, waypoints: updatedWaypoints };
    });

    const updatedJobs = await Promise.all(promises);
    setJobs(updatedJobs); // Update the jobs state with all the new data

    // console.log("assignValues: ", jobs);
  };

  const getJobs = async (waypoints: Waypoint[]) => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", user?.companyId)
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
        values: [],
      })),
    }));
    console.log("getJobs: ", transformedData);
    setJobs(transformedData);
    assignValues(transformedData);
  };

  const getCompanyWaypoints = async () => {
    const { data, error } = await supabase
      .from("company_waypoints")
      .select("*")
      .eq("company_id", user?.companyId)
      .order("order_num");
    if (error) {
      alert("An error occurred in getCompanyWaypoints: " + error.message);
      return;
    }
    console.log("getCompanyWaypoints - data", data);

    // Await the dashboard waypoints to ensure they are loaded before filtering
    const waypoint_ids = await getDashboardWaypoints(); // out of order waypoint ids
    console.log("waypoint_ids", waypoint_ids);

    // Filter the company waypoints to only include those in the dashboard
    const transformedData = data
      .filter((waypoint) => waypoint_ids?.includes(waypoint.id))
      .map((waypoint) => ({
        id: waypoint.id,
        name: waypoint.waypoint_name,
        values: ["", ""],
      }));
    console.log("transformedData", transformedData);
    setHeaders(transformedData.map((waypoint) => waypoint.name));
    getJobs(transformedData);
  };

  const getDashboardName = async () => {
    const { data, error } = await supabase
      .from("dashboards")
      .select("dashboard_name")
      .eq("id", dashboardId);
    if (error) {
      alert("An error occurred in getDashboardName: " + error.message);
      return;
    }

    console.log("getDashboardName - data[0]", data[0]);
    setDashboardName(data[0].dashboard_name);
  };

  useEffect(() => {
    getDashboardName();
    getCompanyWaypoints();
  }, []);

  return (
    <div>
      <table className="w-full">
        <tbody>
          {/* Main Header */}
          <tr>
            <td className="border p-1 font-bold text-2xl">{dashboardName}</td>
            {headers.map((header, index) => (
              <td
                key={index}
                colSpan={subHeaders.length}
                className="border p-1 font-bold text-2xl"
              >
                {header}
              </td>
            ))}
          </tr>
          {/* Subheaders */}
          <tr>
            <td className="border p-1 font-bold">Job Name</td>
            {headers.map(() =>
              subHeaders.map((subHeader, index) => (
                <td key={index} className="border p-1 font-bold">
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
              <td className="border p-1 font-bold">{job.name}</td>
              {job.waypoints.map((waypoint) =>
                waypoint.values.map((value, index) => (
                  <td key={index} className="border p-1 ">
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
