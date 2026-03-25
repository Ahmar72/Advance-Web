require("dotenv").config();

import express from "express";
import cors from "cors";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./shared/middleware/error.middleware";

const app = express();
const PORT = parseInt(env.PORT);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "API running" });
});

// Mount API routes
app.use("/api/v1", routes);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ API running on http://localhost:${PORT}`);
});
