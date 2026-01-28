const fs = require('fs');
try {
    const data = fs.readFileSync('functions_list.json', 'utf16le');
    const json = JSON.parse(data);
    json.result.forEach(f => console.log(f.entryPoint));
} catch (e) {
    console.error(e);
}
