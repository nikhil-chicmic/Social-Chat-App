const fs = require('fs');
const https = require('https');

const url = "https://qnatyjdgkwazvcanpcuo.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuYXR5amRna3dhenZjYW5wY3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjQ5NDIsImV4cCI6MjA4ODEwMDk0Mn0.3CSWAKatCIcM3ZN_eXUFcMJ0ygKT0_Wrqy6R6duTwvM";

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('schema.json', data);
    console.log('Schema saved to schema.json');
  });
}).on('error', err => {
  console.error(err);
});
