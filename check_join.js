const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://qnatyjdgkwazvcanpcuo.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuYXR5amRna3dhenZjYW5wY3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjQ5NDIsImV4cCI6MjA4ODEwMDk0Mn0.3CSWAKatCIcM3ZN_eXUFcMJ0ygKT0_Wrqy6R6duTwvM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      user1:user1_id(*),
      user2:user2_id(*)
    `).limit(1);
    
  console.log('Conversations join exact result:', error ? error.message : JSON.stringify(data, null, 2));
}
check();
