import {
  BriefcaseIcon,
  // PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import Sidebar from "../../components/sidebar";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserContext } from "../../contexts/userContext";
import { supabase } from "../../helper/supabaseClient";

type Job = {
  jobId: number;
  jobName: string;
};

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const { user } = useUserContext();
  const navigate = useNavigate();

  const getJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select()
      .eq("company_id", user?.active_company_id);
    if (error) {
      alert("An error occurred while fetching jobs: " + error.message);
      return;
    }

    const transformedData = data.map((job: any) => ({
      jobId: job.id,
      jobName: job.job_name,
    }));
    setJobs(transformedData);
  };

  useEffect(() => {
    getJobs();
  }, []);

  return (
    <Sidebar selected={"Jobs"}>
      <div className=" p-8">
        <div className="w-full">
          <h2 className=" text-4xl font-bold">Jobs</h2>
          <p>Add, edit, and delete jobs as needed.</p>
        </div>

        {/* Add Job Button */}
        <div
          onClick={() => navigate("/add-job")}
          className="items-center cursor-pointer mt-4 bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 inline-flex"
        >
          <PlusIcon className="h-5 w-5 mr-2 stroke-white " />
          <div>Add Job</div>
        </div>

        {/* Jobs List */}
        {jobs.map((job) => (
          <div
            key={job.jobId}
            onClick={() => navigate(`/edit-job?id=${job.jobId}`)}
            className="flex items-center p-2 cursor-pointer border rounded-md my-2 hover:shadow-lg hover:my-3 hover:-mx-1 transition-all"
          >
            <BriefcaseIcon className="h-8, w-8 mr-2" />
            <div className=" w-full">
              <div className="flex items-center">
                <h2 className="font-bold">{job.jobName}</h2>
                {/* <button
                // onClick={() => handleOpenEditWaypoint(waypoint)}
                >
                  <PencilSquareIcon className="h-5 w-5 ml-1 text-gray-600 hover:text-indigo-500 hover:h-6 hover:w-6 transition-all" />
                </button> */}
              </div>
              <h3 className=" text-sm text-slate-500">Active</h3>
            </div>
          </div>
        ))}
      </div>
    </Sidebar>
  );
}
