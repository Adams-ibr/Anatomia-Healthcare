let appInstance: any = null;
let serverInstance: any = null;
let routesPromise: Promise<any> | null = null;

export default async function handler(req: any, res: any) {
    try {
        if (!appInstance) {
            const { createServer } = await import("http");
            const express = (await import("express")).default;
            const { registerRoutes } = await import("../server/routes");

            appInstance = express();
            serverInstance = createServer(appInstance);

            // Body parsing middleware
            appInstance.use(
                express.json({
                    verify: (req: any, _res: any, buf: any) => {
                        req.rawBody = buf;
                    },
                })
            );
            appInstance.use(express.urlencoded({ extended: false }));

            routesPromise = registerRoutes(serverInstance, appInstance);
        }

        await routesPromise;
    } catch (err) {
        console.error("Error setting up routes:", err);
        return res.status(500).json({ 
            error: "Internal Server Error during startup", 
            details: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
        });
    }
    return appInstance(req, res);
}
