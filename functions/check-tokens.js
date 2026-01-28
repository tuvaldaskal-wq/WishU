const admin = require('firebase-admin');
try { admin.initializeApp(); } catch (e) { }

const db = admin.firestore();

async function checkRecent() {
    console.log("Checking recent notifications...");
    try {
        const snapshot = await db.collection('notifications')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();

        if (snapshot.empty) {
            console.log("No notifications found in collection.");
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`[${doc.id}] User: ${data.userId}, Title: ${data.title}, Created: ${data.createdAt ? data.createdAt.toDate() : 'null'}`);
            });
        }
    } catch (error) {
        console.error("Error reading notifications:", error);
    }
}

checkRecent();
