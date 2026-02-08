import { createServer } from "http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
const server = createServer(app);

// Initialize routes
// Note: WebSocket functionality will not work in Vercel Serverless environment
registerRoutes(server, app);

export default app;
