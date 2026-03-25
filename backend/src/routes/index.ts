import { Router } from "express";
import authRoutes from "../features/auth/auth.routes";

const router = Router();

// Mount feature routers
router.use("/auth", authRoutes);

// Add other feature routes here as they're created

export default router;
