const admin = require('firebase-admin');
// Initialize with default credentials
// This relies on GOOGLE_APPLICATION_CREDENTIALS or being logged in via gcloud/firebase
try {
    admin.initializeApp();
} catch (e) {
    // If running in an environment where default credentials aren't set up, 
    // we might need to rely on the emulator or specific keys, but let's try default first.
    console.log("Initialization might have failed if already initialized:", e.message);
}

const db = admin.firestore();

const userId = 'SnlRjWGr53crY65mNXKIc8tWoFE3';
const notification = {
    userId: userId,
    title: 'Test Notification from Script',
    message: 'This is a test notification created via Node.js script!',
    type: 'test',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
};

async function run() {
    console.log(`Creating notification for user: ${userId}`);
    try {
        const docRef = await db.collection('notifications').add(notification);
        console.log(`Notification created with ID: ${docRef.id}`);
        console.log("Check your device for the notification!");
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

run();
