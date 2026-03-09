const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://qnatyjdgkwazvcanpcuo.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuYXR5amRna3dhenZjYW5wY3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjQ5NDIsImV4cCI6MjA4ODEwMDk0Mn0.3CSWAKatCIcM3ZN_eXUFcMJ0ygKT0_Wrqy6R6duTwvM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const checks = ["chats", "messages", "conversations", "rooms", "chat_rooms", "user_chats", "users"];
  for (const table of checks) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    console.log(`Table ${table}:`, error ? error.message : "Exists, rows fetched: " + data.length);
  }
}
check();
