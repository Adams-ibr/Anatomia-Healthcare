import * as functions from "firebase-functions";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

// Import all the route setup code from server
import { registerRoutes } from "../../server/routes";
import { setupSession } from "../../server/auth";

const app = express();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup session and routes
setupSession(app);

// Create a dummy HTTP server for registerRoutes compatibility
const http = require("http");
let httpServer: any = null;

// Initialize routes on first request
let routesInitialized = false;

app.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!routesInitialized) {
    if (!httpServer) {
      httpServer = http.createServer(app);
    }
    await registerRoutes(httpServer, app);
    routesInitialized = true;
  }
  next();
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[API Error]", err);
  const isDev = process.env.NODE_ENV === "development";
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(isDev && { details: err.stack }),
  });
});

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

// Health check function
export const health = functions.https.onRequest((req: express.Request, res: express.Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    region: process.env.FUNCTION_REGION || "us-central1",
  });
});
