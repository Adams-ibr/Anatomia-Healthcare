import dotenv from "dotenv";
dotenv.config();

const criticalVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SESSION_SECRET",
  "PORT",
  "NODE_ENV"
];

console.log("Environment Variable Audit:");
criticalVars.forEach(v => {
  const val = process.env[v];
  console.log(`${v}: ${val ? "SET (length: " + val.length + ")" : "MISSING"}`);
});

if (!process.env.SESSION_SECRET) {
  console.error("CRITICAL: SESSION_SECRET is missing. Express-session will fail!");
}
