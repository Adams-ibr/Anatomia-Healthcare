import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

async function checkCourse() {
    const { data, error } = await supabase
        .from("courses")
        .select("title, slug, is_published")
        .eq("slug", "introduction-to-human-anatomy")
        .single();

    if (error) {
        console.error("Error fetching course:", error.message);
    } else {
        console.log("Course found:", data);
    }
}

checkCourse();
