const fs = require('fs');
try {
    const logs = JSON.parse(fs.readFileSync('logs_manual.json', 'utf8'));
    logs.forEach(l => console.log("LOG ENTRY:", l.log));
} catch (e) {
    console.error("Error parsing logs:", e);
}
