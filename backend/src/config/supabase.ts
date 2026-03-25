import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Singleton Supabase client - never instantiate elsewhere
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
