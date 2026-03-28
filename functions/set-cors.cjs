const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
    credential: admin.credential.applicationDefault()
});

const storage = admin.storage();
const bucketName = 'wishu-c16d5.firebasestorage.app';

async function setCors() {
    try {
        const bucket = storage.bucket(bucketName);
        console.log(`Setting CORS on ${bucket.name}...`);

        await bucket.setMetadata({
            cors: [
                {
                    origin: ["*"],
                    method: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
                    responseHeader: ["Content-Type", "Access-Control-Allow-Origin"],
                    maxAgeSeconds: 3600
                }
            ]
        });

        console.log('CORS configuration updated successfully!');
    } catch (error) {
        console.error('Error setting CORS on target bucket:', error.message);

        // Fallback: List all buckets to find the correct one
        console.log('Attempting to list available buckets...');
        try {
            const [buckets] = await storage.getBuckets();
            console.log('Available buckets:');
            buckets.forEach(b => console.log(`- ${b.name}`));

            // Try on the first bucket found if explicit failed
            if (buckets.length > 0) {
                const firstBucket = buckets[0];
                console.log(`\nTrying to set CORS on ${firstBucket.name}...`);
                await firstBucket.setMetadata({
                    cors: [
                        {
                            origin: ["*"],
                            method: ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
                            responseHeader: ["Content-Type", "Access-Control-Allow-Origin"],
                            maxAgeSeconds: 3600
                        }
                    ]
                });
                console.log(`Success on ${firstBucket.name}!`);
            }

        } catch (listError) {
            console.error('Error listing buckets:', listError.message);
        }
    }
}

setCors();
