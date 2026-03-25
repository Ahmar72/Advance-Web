import { z } from "zod";

export const signInWithGitHubSchema = z.object({
  code: z.string().min(1, "GitHub code is required"),
});

export type SignInWithGitHubInput = z.infer<typeof signInWithGitHubSchema>;

export const signOutSchema = z.object({});

export type SignOutInput = z.infer<typeof signOutSchema>;
