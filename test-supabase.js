const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function main() {
  const code = fs.readFileSync('lib/supabase.ts', 'utf8');
  const urlMatch = code.match(/supabaseUrl\s*=\s*"([^"]+)"/);
  const anonMatch = code.match(/supabaseAnonKey\s*=\s*\r?\n?\s*"([^"]+)"/);
  if (urlMatch && anonMatch) {
    const supabase = createClient(urlMatch[1], anonMatch[1]);
    
    const { data: data1, error: err1 } = await supabase
      .from('followers')
      .select('*, users(*)')
      .limit(1);
    
    console.log('Error hint:', err1?.message, err1?.hint, err1?.details);
  } else {
    console.log('Could not parse configs');
  }
}

main().catch(console.error);
