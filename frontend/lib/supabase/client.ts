import { createBrowserClient } from "@supabase/ssr";
import type { AppDatabase } from "@/lib/supabase/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () =>
  createBrowserClient<AppDatabase>(supabaseUrl!, supabaseKey!);

// Keep a singleton export for existing imports across the app.
export const supabase = createClient();
