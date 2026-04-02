import { supabase } from "./server/db";
import dotenv from "dotenv";
dotenv.config();

async function checkDb() {
  console.log("Checking Supabase connection...");
  try {
    const { data: users, error: userError } = await supabase.from("users").select("count").limit(1);
    if (userError) {
      console.error("Error accessing 'users' table:", userError);
    } else {
      console.log("'users' table is accessible.");
    }

    const { data: sessions, error: sessionError } = await supabase.from("sessions").select("count").limit(1);
    if (sessionError) {
      console.error("Error accessing 'sessions' table:", sessionError);
    } else {
      console.log("'sessions' table is accessible.");
    }

    const { data: waitlist, error: waitlistError } = await supabase.from("waitlist").select("count").limit(1);
    if (waitlistError) {
      console.error("Error accessing 'waitlist' table (Expected if not pushed):", waitlistError);
    } else {
      console.log("'waitlist' table is accessible.");
    }
  } catch (e) {
    console.error("Unexpected error during DB check:", e);
  }
}

checkDb();
