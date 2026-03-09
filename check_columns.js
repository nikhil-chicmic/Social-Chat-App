const fs = require('fs');
try {
  const schema = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
  console.log("Conversations columns:", Object.keys(schema.definitions?.conversations?.properties || {}));
  console.log("Messages columns:", Object.keys(schema.definitions?.messages?.properties || {}));
  console.log("All tables:", Object.keys(schema.definitions || {}));
} catch (e) {
  console.error("Error reading schema:", e.message);
}
