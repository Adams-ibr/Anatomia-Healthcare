
import { supabase } from "../server/db";

async function verify() {
    console.log("Verifying Supabase connection...");
    console.log("URL:", process.env.SUPABASE_URL ? "Set" : "Not Set");
    console.log("Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Not Set");

    try {
        // Try to select from a table that should exist, e.g., 'members' or just check auth or health
        // valid, but depends on schema. interactions-storage.ts uses 'members', 'conversations', etc.
        const { data, error, count } = await supabase
            .from("members")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.error("Supabase connection failed:", error.message);
            process.exit(1);
        }

        console.log("Supabase connection successful!");
        console.log("Members count:", count);
    } catch (err) {
        console.error("Unexpected error:", err);
        process.exit(1);
    }
}

verify();
