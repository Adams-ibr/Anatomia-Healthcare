import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import express, { type Express, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "../server/routes";
import { setupSession } from "../server/auth";

const app = express();

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

app.use(
    express.json({
        verify: (req: Request, _res: Response, buf: Buffer) => {
            req.rawBody = buf;
        },
    })
);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let routesPromise: Promise<any> | null = null;
let httpServer: Server<typeof IncomingMessage, typeof ServerResponse> | null = null;

async function ensureRoutes(): Promise<void> {
    if (!routesPromise) {
        if (!httpServer) {
            httpServer = createServer(app);
        }
        setupSession(app);
        routesPromise = registerRoutes(httpServer, app);
    }
    await routesPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
        await ensureRoutes();
        return new Promise<void>((resolve, reject) => {
            res.on("finish", () => resolve());
            res.on("close", () => resolve());
            res.on("error", (err) => reject(err));
            app(req as any, res as any, (err?: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error("Error handling API request:", err);
        const isDevelopment = process.env.NODE_ENV === "development";
        const response: Record<string, unknown> = { 
            error: "Internal Server Error during startup",
            message: err instanceof Error ? err.message : String(err),
        };
        if (isDevelopment && err instanceof Error) {
            response.details = err.message;
            response.stack = err.stack;
        }
        if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify(response));
        } else {
            res.end();
        }
    }
}
