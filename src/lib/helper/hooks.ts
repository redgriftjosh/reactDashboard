import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useUserContext } from "../contexts/userContext";
import { useCompanyContext } from "../contexts/companyContext";
import { TUserCompany } from "../types/types";

// Fetch the user's data
export const useFetchUser = () => {
    const { user, setUser } = useUserContext();
    const [loading, setLoading] = useState<boolean>(true);

    async function getPublicUserData(userId: string) {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId);
        if (error) console.error("Error getting public user data", error.message);
        // if (data) setUser(data[0]);
        try {
            if (data) {
                setUser(data[0]);
                setLoading(false);
                return user;
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
        
    }

    async function getUserData() {
        const { data } = await supabase.auth.getUser();
        if(data.user) {
            getPublicUserData(data.user?.id || "");
        } else {
            setLoading(false);
        }
        console.log("dataGetUser", data);
    }

    useEffect(() => {
        console.log("userUseEffect", user);

    }, [user]);

    useEffect(() => {
        getUserData();
    }, []);

    return { user, loading };
};

// Get the users current active company
export const useFetchCompany = () => {
    const { user } = useUserContext();
    const { company, setCompany } = useCompanyContext();
    const [loading, setLoading] = useState<boolean>(true);

    async function getCompanyData(companyId: number) {
        const { data, error } = await supabase
            .from("companies")
            .select("*")
            .eq("id", companyId);
        if (error) console.error("Error getting company data", error.message);
        try {
            if (data) {
                setCompany(data[0]);
                setLoading(false);
                return company;
            }
        } catch (error) {
            console.error('Failed to fetch items:', error);
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user && user.active_company_id) {
            getCompanyData(user.active_company_id);
        }
    }, [user?.active_company_id]);

    return { company, loading };
};

// Switch the user's active company
export const useSwitchCompany = () => {
    const { setCompany } = useCompanyContext();
    const { user, setUser } = useUserContext();

    async function updateUser(newCompanyId: number) {
        if (user) {
            setUser({
                ...user,
                active_company_id: newCompanyId,
            });

            await supabase.from("users").update({
                active_company_id: newCompanyId,
            }).eq("id", user.id);
        }
    }

    async function setNewCompany(newCompanyId: number) {
        const { data, error } = await supabase
            .from("companies")
            .select("*")
            .eq("id", newCompanyId);
        if (error) console.error("Error getting company data", error.message);
        try {
            if (data) setCompany(data[0]);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        }
    }

    const switchCompany = async (newCompanyId: number) => {
        setNewCompany(newCompanyId);
        updateUser(newCompanyId);
    };
    
    return switchCompany;
};

// Fetch list of user's companies
export const useFetchUserCompanies = (userId: string | null) => {
    const [ companies, setCompanies ] = useState<TUserCompany[] | null>(null);
    const { user } = useUserContext();

    async function getUserCompanies() {
        const { data, error } = await supabase.rpc("get_user_companies", {
            user_id_param: userId,
        });
        if (error) {
            console.log("Error getUserCompanies", error.message);
            return;
        }
        if (data) {
            // remove the active company from the list. No need to have the active company displayed in available companeis if it's already being displayed as the active company.
            const filteredData = data.filter((company: { company_id: number | null | undefined; }) => company.company_id !== user?.active_company_id);
            setCompanies(filteredData);
        }
    }

    // because we already called this on the profile page my hope is that the useEffect will run when the user changes the active company to rerender the companies list.
    useEffect(() => {
        if (userId) getUserCompanies();
    }, [user?.active_company_id]);

    return { companies, setCompanies };
    
};

export const useCreateCompany = () => {
    const { user } = useUserContext();

    async function insertJunctionTable(companyId: number) {
        const { data, error } = await supabase
          .from("junction_user_companies")
          .insert({ company_id: companyId, user_id: user?.id, role_id: 1 })
          .select();
        if (error) {
          alert("useCreateCompany: " + error.message);
        } else {
          console.log("insertJunctionTable", data);
            return data[0];
        }
    }

    async function insertCompaniesTable(companyName: string) {
        const { data, error } = await supabase
          .from("companies")
          .insert({ company_name: companyName })
          .select();
        if (error) {
          alert("insertCompaniesTable: " + error.message);
        } else {
          console.log("insertCompaniesTable", data);
          return data[0];
        }
    }
    
    const createCompany = async (companyName: string) => {
        if (companyName === "") {
            alert("Please enter a company name");
            return;
        }
        const company = await insertCompaniesTable(companyName);
        if (!company) {
            alert('Failed to create company');
            return;
        }
        const junction = await insertJunctionTable(company.id);

        if (!junction) {
            alert('Failed to create company');
            return;
        }
        
        return {
            company_id: company.id,
            company_name: company.company_name || "",
            role_name: "Admin",
            user_id: junction.user_id
        };
    };

    return createCompany;
};
