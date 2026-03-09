const fs = require('fs');
try {
  const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
  console.log("conversation_participants columns:", Object.keys(schema.definitions?.conversation_participants?.properties || {}));
} catch (e) {
  console.error("Error reading schema:", e.message);
}
