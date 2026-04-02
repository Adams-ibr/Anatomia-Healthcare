let initializedApp: any = null;
let initializedPromise: any = null;

export default async function handler(req: any, res: any) {
    try {
        if (!initializedApp) {
            // Using require() ensures Vercel's nft bundler includes the files,
            // while allowing us to catch any unhandled initialization exceptions.
            const { createServer } = require("http");
            const express = require("express");
            const { registerRoutes } = require("../server/routes");

            const app = express();
            const server = createServer(app);

            app.use(
                express.json({
                    verify: (req: any, _res: any, buf: any) => {
                        req.rawBody = buf;
                    },
                })
            );
            app.use(express.urlencoded({ extended: false }));

            initializedPromise = registerRoutes(server, app);
            initializedApp = app;
        }

        await initializedPromise;
    } catch (err) {
        console.error("Critical Vercel Boot Error:", err);
        return res.status(500).json({ 
            error: "Internal Server Error during startup", 
            details: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined
        });
    }

    return initializedApp(req, res);
}
