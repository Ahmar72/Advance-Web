import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional().default("4000"),
  SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase service role key required"),
  FRONTEND_URL: z.string().url("Invalid frontend URL").optional().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).optional().default("development"),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional().default("noreply@adflowpro.com"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
