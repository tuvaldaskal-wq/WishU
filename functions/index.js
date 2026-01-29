const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

console.log("Functions backend loaded!");

/**
 * createWishlist
 * Creates a new wishlist document in Firestore.
 * 
 * Expected Request Body:
 * {
 *   "title": string,
 *   "description": string (optional),
 *   "occassion": string (optional, e.g. "Birthday"),
 *   "date": string (ISO date string, optional)
 * }
 * 
 * Returns:
 * {
 *   "id": string (the new wishlist ID),
 *   "message": "Wishlist created successfully"
 * }
 */
exports.createWishlist = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
    }

    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    try {
        const { title, description, occassion, date } = req.body;

        // Basic Validation
        if (!title) {
            res.status(400).send({ error: "Missing required field: title" });
            return;
        }

        // TODO: Get User ID from auth token if available (currently unauthenticated as per instructions)
        // For now, we'll assume it's an anonymous or client-side managed owner

        const wishlistData = {
            title,
            description: description || "",
            occassion: occassion || null,
            targetDate: date ? new Date(date) : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            itemCount: 0
        };

        const docRef = await admin.firestore().collection("wishlists").add(wishlistData);

        console.log(`Wishlist created with ID: ${docRef.id}`);

        res.status(201).send({
            id: docRef.id,
            message: "Wishlist created successfully"
        });

    } catch (error) {
        console.error("Error creating wishlist:", error);
        res.status(500).send({ error: "Internal Server Error" });
    }
});
