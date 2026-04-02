import { build as esbuild } from "esbuild";
import { readFile } from "fs/promises";
import path from "path";

/**
 * Build the Vercel serverless API function.
 * Uses esbuild to bundle api/index.ts into api/index.js,
 * resolving path aliases (@shared/*) that @vercel/node can't handle.
 */

// Deps to bundle (not mark as external) for faster cold starts
const bundleDeps = [
    "connect-pg-simple",
    "cors",
    "drizzle-orm",
    "drizzle-zod",
    "express",
    "express-session",
    "pg",
    "ws",
    "zod",
    "bcrypt",
    "cookie",
    "crypto",
];

async function buildApi() {
    console.log("Building Vercel API function...");

    const pkg = JSON.parse(await readFile("package.json", "utf-8"));
    const allDeps = [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
    ];

    // Mark everything as external — Vercel will install node_modules
    // esbuild is just used to resolve path aliases and compile TypeScript
    const externals = allDeps;

    await esbuild({
        entryPoints: ["api/index.ts"],
        platform: "node",
        bundle: true,
        format: "esm",
        outfile: "api/index.mjs",
        target: "node18",
        sourcemap: false,
        logLevel: "info",
        external: externals,
        alias: {
            "@shared": path.resolve("shared"),
            "@": path.resolve("client", "src"),
        },
        banner: {
            js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
        },
    });

    console.log("API function built successfully!");
}

buildApi().catch((err) => {
    console.error("API build failed:", err);
    process.exit(1);
});
