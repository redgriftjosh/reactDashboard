
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";

COMMENT ON SCHEMA "public" IS 'standard public schema';

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

CREATE TYPE "public"."company_details" AS (
	"user_id" "uuid",
	"company_id" bigint,
	"company_name" "text",
	"role_name" "text"
);

ALTER TYPE "public"."company_details" OWNER TO "postgres";

CREATE TYPE "public"."company_details_1" AS (
	"user_id" "uuid",
	"company_id" bigint,
	"company_name" "text"
);

ALTER TYPE "public"."company_details_1" OWNER TO "postgres";

CREATE TYPE "public"."company_users" AS (
	"teammate_id" "uuid",
	"first_name" "text",
	"last_name" "text",
	"email" "text",
	"role_name" "text"
);

ALTER TYPE "public"."company_users" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."generate_dashboard_report"("p_company_id" integer) RETURNS TABLE("job_name" "text", "waypoint" "text", "target_completion_date" "date", "actual_completion_date" "date", "status" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    waypoint_names TEXT[];
    sql_query TEXT;
    d_waypoint_name TEXT;
BEGIN
    -- Get the list of waypoints for the given company
    SELECT ARRAY_AGG(d_waypoint_name ORDER BY id)
    INTO waypoint_names
    FROM company_waypoints
    WHERE company_id = p_company_id;

    -- Start constructing the SQL query
    sql_query := 'SELECT jobs.job_name';

    -- Loop through each waypoint to create the dynamic part of the query
    FOREACH d_waypoint_name IN ARRAY waypoint_names LOOP
        sql_query := sql_query || ', MAX(CASE WHEN cw.waypoint_name = ''' || d_waypoint_name || ''' THEN jw.target_completion_date END) AS "' || d_waypoint_name || ' Target"';
        sql_query := sql_query || ', MAX(CASE WHEN cw.waypoint_name = ''' || d_waypoint_name || ''' THEN jw.actual_completion_date END) AS "' || d_waypoint_name || ' Actual"';
        sql_query := sql_query || ', MAX(CASE WHEN cw.waypoint_name = ''' || d_waypoint_name || ''' THEN CASE ' ||
                    'WHEN jw.actual_completion_date IS NULL THEN ''In Progress'' ' ||
                    'WHEN jw.actual_completion_date > jw.target_completion_date THEN ''LATE'' ' ||
                    'ELSE ''Done'' END END) AS "' || d_waypoint_name || ' Status"';
    END LOOP;

    -- Add the FROM and JOIN clauses
    sql_query := sql_query || ' FROM jobs';
    sql_query := sql_query || ' LEFT JOIN job_waypoints jw ON jobs.id = jw.job_id';
    sql_query := sql_query || ' LEFT JOIN company_waypoints cw ON jw.waypoint_id = cw.id';
    sql_query := sql_query || ' WHERE jobs.company_id = ' || p_company_id;
    sql_query := sql_query || ' GROUP BY jobs.job_name';
    sql_query := sql_query || ' ORDER BY jobs.job_name';

    -- Execute the dynamic SQL query
    RETURN QUERY EXECUTE sql_query;
END;
$$;

ALTER FUNCTION "public"."generate_dashboard_report"("p_company_id" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_company_users"("company_id_param" integer) RETURNS SETOF "public"."company_users"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT j.user_id, u.first_name, u.last_name, u.email, r.role_name
    From junction_user_companies j
    join users u on j.user_id = u.id
    LEFT JOIN roles r ON j.role_id = r.id
    where company_id = company_id_param;
END;
$$;

ALTER FUNCTION "public"."get_company_users"("company_id_param" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_user_companies"() RETURNS SETOF "public"."company_details"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT j.user_id, j.company_id, c.company_name, r.role_name
    FROM junction_user_companies j
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN roles r ON j.role_id = r.id
    WHERE j.user_id = auth.uid();
END;
$$;

ALTER FUNCTION "public"."get_user_companies"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_user_companies"("user_id_param" "uuid") RETURNS SETOF "public"."company_details"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT j.user_id, j.company_id, c.company_name, r.role_name
    FROM junction_user_companies j
    JOIN companies c ON j.company_id = c.id
    LEFT JOIN roles r ON j.role_id = r.id
    WHERE j.user_id = user_id_param;
END;
$$;

ALTER FUNCTION "public"."get_user_companies"("user_id_param" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."switch_users_active_company"("company_id_param" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$

DECLARE
    user_uuid uuid := auth.uid(); -- Get the UUID of the currently authenticated user
BEGIN

    -- First, verify that there is a link between the user and the company in the junction_user_companies table
    IF EXISTS (
        SELECT 1
        FROM junction_user_companies
        WHERE user_id = user_uuid AND company_id = company_id_param::bigint
    ) THEN
        -- If the link exists, update the active_company_id in the users table
        UPDATE users
        SET active_company_id = company_id_param::bigint
        WHERE id = user_uuid;
    ELSE
        RAISE EXCEPTION 'No association between the user and the specified company.';
    END IF;
END;
$$;

ALTER FUNCTION "public"."switch_users_active_company"("company_id_param" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_name" "text",
    "created_by" "uuid" DEFAULT "auth"."uid"()
);

ALTER TABLE "public"."companies" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."company_waypoints" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" bigint,
    "waypoint_name" "text",
    "order_num" smallint
);

ALTER TABLE "public"."company_waypoints" OWNER TO "postgres";

ALTER TABLE "public"."company_waypoints" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."company_waypoints_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."dashboard_waypoints" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dashboard_id" bigint,
    "waypoint_id" bigint
);

ALTER TABLE "public"."dashboard_waypoints" OWNER TO "postgres";

ALTER TABLE "public"."dashboard_waypoints" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."dashboard_waypoints_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."dashboards" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dashboard_name" "text",
    "dashboard_description" "text",
    "company_id" bigint,
    "sub_headers" "text"[]
);

ALTER TABLE "public"."dashboards" OWNER TO "postgres";

ALTER TABLE "public"."dashboards" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."dashboards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."job_waypoints" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "job_id" bigint,
    "target_completion" "date",
    "actual_completion" "date",
    "waypoint_id" bigint,
    "status" "text"
);

ALTER TABLE "public"."job_waypoints" OWNER TO "postgres";

ALTER TABLE "public"."job_waypoints" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."job_waypoints_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" bigint,
    "job_name" "text"
);

ALTER TABLE "public"."jobs" OWNER TO "postgres";

ALTER TABLE "public"."jobs" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."jobs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."junction_user_companies" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" bigint,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "role_id" bigint
);

ALTER TABLE "public"."junction_user_companies" OWNER TO "postgres";

ALTER TABLE "public"."junction_user_companies" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."junction_user_companies_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role_name" "text"
);

ALTER TABLE "public"."roles" OWNER TO "postgres";

ALTER TABLE "public"."roles" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE "public"."companies" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tbl_companies_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "active_company_id" bigint
);

ALTER TABLE "public"."users" OWNER TO "postgres";

ALTER TABLE ONLY "public"."company_waypoints"
    ADD CONSTRAINT "company_waypoints_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dashboard_waypoints"
    ADD CONSTRAINT "dashboard_waypoints_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."dashboards"
    ADD CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."job_waypoints"
    ADD CONSTRAINT "job_waypoints_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."junction_user_companies"
    ADD CONSTRAINT "junction_user_companies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "tbl_companies_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "tbl_users_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."junction_user_companies"
    ADD CONSTRAINT "unique_user_company" UNIQUE ("user_id", "company_id");

ALTER TABLE ONLY "public"."company_waypoints"
    ADD CONSTRAINT "company_waypoints_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dashboard_waypoints"
    ADD CONSTRAINT "dashboard_waypoints_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "public"."dashboards"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dashboard_waypoints"
    ADD CONSTRAINT "dashboard_waypoints_waypoint_id_fkey" FOREIGN KEY ("waypoint_id") REFERENCES "public"."company_waypoints"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."dashboards"
    ADD CONSTRAINT "dashboards_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."job_waypoints"
    ADD CONSTRAINT "job_waypoints_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."job_waypoints"
    ADD CONSTRAINT "job_waypoints_waypoint_id_fkey" FOREIGN KEY ("waypoint_id") REFERENCES "public"."company_waypoints"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."junction_user_companies"
    ADD CONSTRAINT "junction_user_companies_company_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."junction_user_companies"
    ADD CONSTRAINT "junction_user_companies_role_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."junction_user_companies"
    ADD CONSTRAINT "junction_user_companies_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "public_tbl_companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "public_tbl_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_active_company_id_fkey" FOREIGN KEY ("active_company_id") REFERENCES "public"."companies"("id") ON UPDATE CASCADE ON DELETE SET NULL;

CREATE POLICY "Allow All for Auth Users" ON "public"."dashboard_waypoints" TO "authenticated" USING (true);

CREATE POLICY "Allow All for Auth Users" ON "public"."job_waypoints" TO "authenticated" USING (true);

CREATE POLICY "Allow All for Auth Users" ON "public"."jobs" TO "authenticated" USING (true);

CREATE POLICY "Allow Insert for Auth Users" ON "public"."company_waypoints" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Allow Read for authenticated users" ON "public"."company_waypoints" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Allow Update for Auth Users" ON "public"."company_waypoints" FOR UPDATE TO "authenticated" USING (true);

CREATE POLICY "Allow all for auth users" ON "public"."dashboards" TO "authenticated" USING (true);

CREATE POLICY "Anyone Can Create Users" ON "public"."users" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable Select for Auth user" ON "public"."companies" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."companies" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."junction_user_companies" FOR INSERT TO "authenticated" WITH CHECK (true);

CREATE POLICY "Enable read access for athenticated users" ON "public"."roles" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable select for authenticated users only" ON "public"."junction_user_companies" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable select for users based on user_id" ON "public"."users" FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "Enable update for users based on email" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));

CREATE POLICY "allow delete for auth users" ON "public"."companies" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "allow delete for auth users" ON "public"."company_waypoints" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "allow delete for auth users" ON "public"."dashboard_waypoints" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "allow delete for auth users" ON "public"."dashboards" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "allow delete for auth users" ON "public"."job_waypoints" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "allow delete for auth users" ON "public"."jobs" FOR DELETE TO "authenticated" USING (true);

CREATE POLICY "allow delete for auth users" ON "public"."junction_user_companies" FOR DELETE TO "authenticated" USING (true);

ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."company_waypoints" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dashboard_waypoints" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."dashboards" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."job_waypoints" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."junction_user_companies" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."companies";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."company_waypoints";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."dashboard_waypoints";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."dashboards";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_waypoints";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."jobs";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."roles";

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON FUNCTION "public"."generate_dashboard_report"("p_company_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_dashboard_report"("p_company_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_dashboard_report"("p_company_id" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_company_users"("company_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_users"("company_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_users"("company_id_param" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_companies"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_companies"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_companies"() TO "service_role";

GRANT ALL ON FUNCTION "public"."get_user_companies"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_companies"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_companies"("user_id_param" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."switch_users_active_company"("company_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."switch_users_active_company"("company_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."switch_users_active_company"("company_id_param" integer) TO "service_role";

GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";

GRANT ALL ON TABLE "public"."company_waypoints" TO "anon";
GRANT ALL ON TABLE "public"."company_waypoints" TO "authenticated";
GRANT ALL ON TABLE "public"."company_waypoints" TO "service_role";

GRANT ALL ON SEQUENCE "public"."company_waypoints_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."company_waypoints_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."company_waypoints_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."dashboard_waypoints" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_waypoints" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_waypoints" TO "service_role";

GRANT ALL ON SEQUENCE "public"."dashboard_waypoints_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dashboard_waypoints_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dashboard_waypoints_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."dashboards" TO "anon";
GRANT ALL ON TABLE "public"."dashboards" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboards" TO "service_role";

GRANT ALL ON SEQUENCE "public"."dashboards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."dashboards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."dashboards_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."job_waypoints" TO "anon";
GRANT ALL ON TABLE "public"."job_waypoints" TO "authenticated";
GRANT ALL ON TABLE "public"."job_waypoints" TO "service_role";

GRANT ALL ON SEQUENCE "public"."job_waypoints_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."job_waypoints_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."job_waypoints_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";

GRANT ALL ON SEQUENCE "public"."jobs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."jobs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."jobs_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."junction_user_companies" TO "anon";
GRANT ALL ON TABLE "public"."junction_user_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."junction_user_companies" TO "service_role";

GRANT ALL ON SEQUENCE "public"."junction_user_companies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."junction_user_companies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."junction_user_companies_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";

GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";

GRANT ALL ON SEQUENCE "public"."tbl_companies_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tbl_companies_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tbl_companies_id_seq" TO "service_role";

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
