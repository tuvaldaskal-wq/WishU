import * as functions from './index.js';

console.log("--- DEBUG START ---");
console.log("Successfully loaded module.");
console.log("Exported keys:", Object.keys(functions));

if (Object.keys(functions).length === 0) {
    console.error("ERROR: Module loaded but NO exports found!");
} else {
    console.log("SUCCESS: Functions found:", Object.keys(functions));
}
console.log("--- DEBUG END ---");
