import { createServer } from "http";
import express from "express";
import { registerRoutes } from "../server/routes";

const app = express();
const server = createServer(app);

// Body parsing middleware
app.use(
    express.json({
        verify: (req: any, _res, buf) => {
            req.rawBody = buf;
        },
    })
);
app.use(express.urlencoded({ extended: false }));

// Initialize routes (async)
let routesPromise: Promise<any> | null = null;

function ensureRoutes() {
    if (!routesPromise) {
        routesPromise = registerRoutes(server, app);
    }
    return routesPromise;
}

// Export a handler that waits for routes to be registered before handling requests
export default async function handler(req: any, res: any) {
    try {
        await ensureRoutes();
    } catch (err) {
        console.error("Error setting up routes:", err);
        return res.status(500).json({ error: "Internal Server Error during startup" });
    }
    return app(req, res);
}
