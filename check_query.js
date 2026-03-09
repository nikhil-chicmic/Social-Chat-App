const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://qnatyjdgkwazvcanpcuo.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuYXR5amRna3dhenZjYW5wY3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjQ5NDIsImV4cCI6MjA4ODEwMDk0Mn0.3CSWAKatCIcM3ZN_eXUFcMJ0ygKT0_Wrqy6R6duTwvM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const userId = "484e51ec-0fc7-422f-ae5f-cb45258e74e4"; // need to test without knowing actual user ID
  
  // Just fetch some participants and users
  const { data: partData, error: partErr } = await supabase.from('conversation_participants').select('*').limit(5);
  console.log("Participants:", partData);

  const { data: msgData, error: msgErr } = await supabase.from('messages').select('*').limit(5);
  console.log("Messages:", msgData);
}
check();
