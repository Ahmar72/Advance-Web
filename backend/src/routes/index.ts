import { Router } from "express";
import authRoutes from "../features/auth/auth.routes";
import adsRoutes from "../features/ads/ads.routes";
import paymentsRoutes from "../features/payments/payments.routes";
import moderationRoutes from "../features/moderation/moderation.routes";
import adminRoutes from "../features/admin/admin.routes";
import analyticsRoutes from "../features/analytics/analytics.routes";
import cronRoutes from "../features/cron/cron.routes";
import categoriesRoutes from "../features/taxonomy/categories.routes";
import citiesRoutes from "../features/taxonomy/cities.routes";
import packagesRoutes from "../features/packages/packages.routes";
import searchRoutes from "../features/search/search.routes";
import learningRoutes from "../features/learning/learning.routes";

const router = Router();

// Mount feature routers
router.use("/auth", authRoutes);
router.use("/ads", adsRoutes);
router.use("/search", searchRoutes);
router.use("/categories", categoriesRoutes);
router.use("/cities", citiesRoutes);
router.use("/packages", packagesRoutes);
router.use("/admin/payments", paymentsRoutes);
router.use("/admin", adminRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/moderator", moderationRoutes);
router.use("/cron", cronRoutes);
router.use("/questions", learningRoutes);

export default router;
