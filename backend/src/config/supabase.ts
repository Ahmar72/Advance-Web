import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Create a fresh Supabase admin client per request/job.
 *
 * This avoids stale PostgREST schema cache issues when the DB schema
 * is created/seeded after the backend process has already started.
 */
export const createAdminSupabase = () =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
