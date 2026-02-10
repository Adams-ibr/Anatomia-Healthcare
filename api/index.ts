import { createServer } from "http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
const server = createServer(app);

// Body parsing middleware — MUST be before routes
app.use(
    express.json({
        verify: (req: any, _res, buf) => {
            req.rawBody = buf;
        },
    })
);
app.use(express.urlencoded({ extended: false }));

// Initialize routes (async — Vercel will await the default export if it's a promise)
const routesReady = registerRoutes(server, app);

// Export a handler that waits for routes to be registered before handling requests
export default async function handler(req: any, res: any) {
    await routesReady;
    return app(req, res);
}
