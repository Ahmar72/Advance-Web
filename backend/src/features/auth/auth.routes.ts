import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../shared/middleware/validate.middleware";
import { requireAuth } from "../../shared/middleware/auth.middleware";
import { signInWithGitHubSchema } from "./auth.schema";

const router = Router();

// Public routes
router.get("/github/signin", AuthController.getGitHubSignInUrl);
router.post("/github/callback", validateRequest(signInWithGitHubSchema), AuthController.handleGitHubCallback);
router.post("/refresh", AuthController.refreshSession);

// Protected routes
router.get("/me", requireAuth, AuthController.getCurrentUser);
router.post("/logout", requireAuth, AuthController.logout);

export default router;
