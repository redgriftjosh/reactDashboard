import {
  BriefcaseIcon,
  BuildingOffice2Icon,
  SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import { useUserContext } from "../contexts/userContext";
import ProfileIcon from "../../assets/profileIcon.svg";
import { useNavigate } from "react-router-dom";

// prettier-ignore
const navigation = [
    { name: "Company Waypoints", href: "/company-waypoints", icon: BuildingOffice2Icon },
    { name: "Jobs", href: "/jobs", icon: BriefcaseIcon },
    { name: "Dashboards", href: "/dashboards", icon: SquaresPlusIcon },
  ];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

// prettier-ignore
export default function Sidebar({ children, selected }: { children: React.ReactNode, selected?: "Company Waypoints" | "Jobs" | "Dashboards"}) {
  const { user } = useUserContext();
  const navigate = useNavigate();
  const handleProfileRedirect = () => {
    navigate('/profile');
  };
    return (
      <>
        <div>
          <div className="fixed inset-y-0 z-50 flex w-56 flex-col">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 py-4">
              {/* Profile Section */}
              <div className="py-1 flex items-center" onClick={handleProfileRedirect} style={{ cursor: 'pointer' }}>
                <img src={ProfileIcon} alt="Profile" className="h-10 w-10 mr-2" />
                <div className="py-1">
                  <span className="block font-semibold">Hello, {user?.firstName}</span>
                  <span className="block text-gray-600 font-semibold text-sm">{user?.companyName ?? "No Company Ltd."}</span>
                </div>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <a
                            href={item.href}
                            className={classNames(
                              item.name === selected
                                ? "bg-gray-100 text-indigo-600"
                                : "text-gray-700 hover:text-indigo-600 hover:bg-gray-200",
                              "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                            )}
                          >
                            <item.icon
                              className={classNames(
                                item.name === selected
                                ? "text-indigo-600"
                                  : "text-gray-500 group-hover:text-indigo-600",
                                "h-6 w-6 shrink-0"
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>

                </ul>
              </nav>
            </div>
          </div>
  
          <div className=" pl-56">
            <main className="">
              <div className="">{children}</div>
            </main>
          </div>
        </div>
      </>
    );
  }
