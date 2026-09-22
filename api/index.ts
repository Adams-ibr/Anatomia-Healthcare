import { createServer, type IncomingMessage, type ServerResponse } from "http";
import express, { type Express, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes";

const app = express();
const server = createServer(app);

// Extend Request interface for rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

// Body parsing middleware
app.use(
    express.json({
        verify: (req: Request, _res: Response, buf: Buffer) => {
            req.rawBody = buf;
        },
    })
);
app.use(express.urlencoded({ extended: false }));

// Parse cookies for CSRF and session management
app.use(cookieParser());

// Initialize routes (async)
let routesPromise: Promise<any> | null = null;

function ensureRoutes(): Promise<any> {
    if (!routesPromise) {
        routesPromise = registerRoutes(server, app);
    }
    return routesPromise;
}

// Export a handler that waits for routes to be registered before handling requests
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
        await ensureRoutes();
    } catch (err) {
        console.error("Error setting up routes:", err);
        const isDevelopment = process.env.NODE_ENV === "development";
        const response: Record<string, unknown> = { 
            error: "Internal Server Error during startup", 
        };
        if (isDevelopment && err instanceof Error) {
            response.details = err.message;
            response.stack = err.stack;
        }
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify(response));
        return;
    }
    return app(req, res) as unknown as Promise<void>;
}
