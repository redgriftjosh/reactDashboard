
// Exact tables from the database
export type TUser = {
  id: string;
  created_at: Date | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  active_company_id: number | null;
}

export type TCompany = {
  id: number;
  created_at: Date | null;
  company_name: string | null;
  created_by: string | null;
};

export type TJunctionUserCompany = {
  id: number;
  created_at: Date | null;
  company_id: number;
  user_id: string;
  role_id: number;
};

export type TRole = {
  id: number;
  role_name: string;
};

// Custom types
export type TUserCompany = {
  company_id: number;
  company_name: string;
  role_name: string;
  user_id: string;
};
