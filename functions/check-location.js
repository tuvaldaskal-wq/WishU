const admin = require('firebase-admin');
try { admin.initializeApp(); } catch (e) { }

async function check() {
    // This is hard to get programmatically without metadata service.
    // However, we can try to infer or just ask the Admin SDK to list collections and see if it errors with "region mismatch" (unlikely)
    // Actually, let's just log the project ID to be sure.
    console.log("Project ID:", admin.app().options.projectId);
    console.log("Service Account Credential:", admin.app().options.credential ? "Present" : "Default");
}

check();
