import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ZeroDBClient } from "./clients/zerodb-client";
import { createUserRouter } from "./routes/users";
import { createContextRoutes } from "./routes/contexts";

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || "3001", 10);

app.use(cors());
app.use(express.json());

// Initialize ZeroDB client
const db = new ZeroDBClient({
  baseUrl: process.env.ZERODB_API_BASE_URL || "https://api.ainative.studio",
  apiKey: process.env.ZERODB_API_KEY || "",
  projectId: process.env.ZERODB_PROJECT_ID || "",
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "zerovocab-api", timestamp: new Date().toISOString() });
});

// Mount routes
app.use("/api/v1/users", createUserRouter(db));
app.use(createContextRoutes(db));

app.listen(port, () => {
  console.log(`ZeroVocab API running on port ${port}`);
});

export { app, db };
