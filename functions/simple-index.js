const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

console.log("Raw JavaScript entry point loaded!");

exports.simpleTest = functions
    .region("europe-west1")
    .https.onRequest((req, res) => {
        res.send("Hello from Raw JS!");
    });
