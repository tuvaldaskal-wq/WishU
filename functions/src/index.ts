import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import axios from "axios";

console.log("MODULE_LOADED: functions/src/index.ts is executing...");

// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================

// Initialize Firebase Admin lazily
let adminApp: admin.app.App | undefined;

function getAdmin(): admin.app.App {
    if (!adminApp) {
        adminApp = admin.initializeApp({
            projectId: "wishu-c16d5",
            credential: admin.credential.applicationDefault()
        });
    }
    return adminApp;
}

// ScrapingBee API configuration
const SCRAPINGBEE_API_URL = "https://app.scrapingbee.com/api/v1/";

// Runtime options for functions
const runtimeOpts: functions.RuntimeOptions = {
    timeoutSeconds: 60,
    memory: "512MB"
};

// Region configuration
const REGION = "europe-west1";

// ============================================================================
// TYPES
// ============================================================================

interface ScrapedResult {
    title: string;
    description: string;
    image: string;
    price?: string;
    currency?: string;
    priceSource?: string;
    error?: string;
    errorCode?: string;
    _debug?: any;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function cleanUrl(url: string): string {
    let cleaned = url.trim();
    cleaned = cleaned.replace(/([?&])(utm_[^&]*|ref[^&]*|affiliate[^&]*|source[^&]*|fbclid[^&]*|gclid[^&]*|mc_[^&]*)/gi, '$1');
    cleaned = cleaned.replace(/[?&]+$/, '');
    cleaned = cleaned.replace(/\?&/, '?');
    return cleaned;
}

function getWaitForSelector(url: string): string | null {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("zara.com")) return ".product-detail-view__main-info";
    if (lowerUrl.includes("adidas")) return ".product-description";
    if (lowerUrl.includes("shein.com") || lowerUrl.includes("shein.co.il")) return ".product-intro";
    if (lowerUrl.includes("hm.com")) return "[data-testid=\"productName\"]";
    if (lowerUrl.includes("asos.com")) return "#product-details";
    return null;
}

function isBlockPage(html: string): boolean {
    const blockIndicators = [
        "access denied", "are you a robot", "security check",
        "blocked", "captcha", "cloudflare", "ray id",
        "enable javascript", "403 forbidden"
    ];
    const lowerHtml = html.toLowerCase();
    return blockIndicators.some(indicator => lowerHtml.includes(indicator));
}

function extractTitle(html: string): string {
    const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    if (ogMatch?.[1]) return ogMatch[1].trim();

    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i);
    if (twitterMatch?.[1]) return twitterMatch[1].trim();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) return titleMatch[1].trim().split('|')[0].split('-')[0].trim();

    return "";
}

function extractDescription(html: string): string {
    const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    if (ogMatch?.[1]) return ogMatch[1].trim();

    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (metaMatch?.[1]) return metaMatch[1].trim();

    return "";
}

function extractImage(html: string): string {
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    if (ogMatch?.[1] && ogMatch[1].startsWith('http')) return ogMatch[1].trim();

    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i);
    if (twitterMatch?.[1] && twitterMatch[1].startsWith('http')) return twitterMatch[1].trim();

    return "";
}

function extractPrice(html: string): { price: string | null; currency: string | null; source: string } {
    // JSON-LD extraction
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
        try {
            const parsed = JSON.parse(match[1]);
            const price = findPriceInObject(parsed);
            if (price) return { ...price, source: "jsonld" };
        } catch { }
    }

    // Meta tag extraction
    const metaMatch = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']*)["']/i);
    if (metaMatch?.[1]) {
        return { price: metaMatch[1], currency: "ILS", source: "meta" };
    }

    // Regex extraction
    const priceMatches = html.match(/(?:₪|ILS|NIS)\s*([\d,]+(?:\.\d{2})?)|(?:[\d,]+(?:\.\d{2})?)\s*(?:₪|ILS|NIS)/gi);
    if (priceMatches?.[0]) {
        const cleanPrice = priceMatches[0].replace(/[^\d.,]/g, '');
        return { price: cleanPrice, currency: "ILS", source: "regex" };
    }

    return { price: null, currency: null, source: "none" };
}

function findPriceInObject(obj: any, depth = 0): { price: string; currency: string } | null {
    if (depth > 10) return null;
    if (!obj || typeof obj !== "object") return null;

    if (obj["@type"] === "Offer" || obj["@type"] === "Product") {
        if (obj.price || obj.offers?.price) {
            return {
                price: String(obj.price || obj.offers?.price),
                currency: obj.priceCurrency || obj.offers?.priceCurrency || "ILS"
            };
        }
    }

    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findPriceInObject(item, depth + 1);
            if (result) return result;
        }
    } else {
        for (const key of Object.keys(obj)) {
            const result = findPriceInObject(obj[key], depth + 1);
            if (result) return result;
        }
    }
    return null;
}

function normalizePrice(price: string, currency: string | null): string {
    if (!price) return "";
    let cleaned = price.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num)) return price;
    return `${num.toFixed(2)} ${currency || "₪"}`;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * V1 Function: Scrape Product Details
 */
console.log("MODULE_LOADED: functions/src/index.ts is executing... VERSION 2 (CORS FIXED)");

// ... (init code)

/**
 * V1 Function: Scrape Product Details
 */
export const scrapeProductDetails = functions
    .region(REGION)
    .runWith(runtimeOpts)
    .https.onRequest(async (req, res) => {
        // STRICT CORS HANDLING - MUST BE FIRST
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Added GET for browser testing if needed
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, firebase-instance-id-token');

        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }

        getAdmin(); // Ensure initialization

        // Handle both JSON body (standard) and data property (callable style compatibility)
        const body = req.body;
        const url = (body.data && body.data.url) ? body.data.url : body.url;

        if (!url) {
            res.status(400).send({ title: "", description: "", image: "", error: "No URL" });
            return;
        }

        const apiKey = functions.config().scrapingbee?.api_key || process.env.SCRAPINGBEE_API_KEY;
        if (!apiKey) {
            res.status(500).send({ title: "", description: "", image: "", error: "Config missing" });
            return;
        }

        const cleanedUrl = cleanUrl(url);
        console.log(`Processing URL: ${cleanedUrl}`);

        const params: any = {
            api_key: apiKey,
            url: cleanedUrl,
            render_js: "true",
            premium_proxy: "true",
            stealth_proxy: "true",
            country_code: "il",
            wait: "5000",
            wait_browser: "networkidle0",
            window_width: "1920",
            window_height: "1080",
            device: "desktop",
        };

        const selector = getWaitForSelector(cleanedUrl);
        if (selector) params.wait_for = selector;

        try {
            console.log("Calling ScrapingBee via Axios...");
            const response = await axios.get(SCRAPINGBEE_API_URL, {
                params: params,
                timeout: 55000,
            });

            const html = response.data;

            if (!html || html.length < 500) {
                console.warn("ScrapingBee returned empty/short content");
                res.status(200).send({ title: "", description: "", image: "", error: "Empty content", errorCode: "SCRAPE_FAILED" });
                return;
            }

            if (isBlockPage(html)) {
                console.warn("BLOCKED by WAF");
                res.status(200).send({ title: "", description: "", image: "", error: "Blocked by WAF", errorCode: "SCRAPE_FAILED_MANUAL_REQUIRED" });
                return;
            }

            console.log("HTML received, length:", html.length);

            const title = extractTitle(html);
            const description = extractDescription(html);
            const image = extractImage(html);
            const priceData = extractPrice(html);

            const result: ScrapedResult = {
                title,
                description,
                image,
                price: normalizePrice(priceData.price || "", priceData.currency),
                currency: priceData.currency || undefined,
                priceSource: priceData.source,
                _debug: {
                    htmlLength: html.length,
                    htmlSnippet: html.substring(0, 500),
                }
            };

            res.status(200).send(result);

        } catch (error) {
            console.error("ScrapingBee call failed:", error);
            if (axios.isAxiosError(error)) {
                console.error("Axios error details:", {
                    code: error.code,
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    responseData: typeof error.response?.data === 'string'
                        ? error.response.data.substring(0, 500)
                        : error.response?.data,
                });
                if (error.code === 'ECONNABORTED' || error.response?.status === 408) {
                    res.status(200).send({ title: "", description: "", image: "", error: "Scraping timed out", errorCode: "SCRAPE_FAILED" });
                    return;
                }
            }
            res.status(200).send({ title: "", description: "", image: "", error: "Scraping failed", errorCode: "SCRAPE_FAILED" });
        }
    });

/**
 * V1 Function: Health Check Ping
 */
export const pingV2 = functions
    .region(REGION)
    .runWith(runtimeOpts)
    .https.onRequest((req, res) => {
        getAdmin(); // Ensure initialization
        console.log("Ping triggered!");
        res.send("Pong v1 Europe!");
    });

/**
 * V1 Function: Send Push Notifications
 * Triggered by creation of documents in 'notifications' collection.
 */
export const sendPushNotificationV2 = functions
    .region(REGION)
    .runWith(runtimeOpts)
    .firestore.document("notifications/{notificationId}")
    .onCreate(async (snapshot, context) => {
        getAdmin(); // Ensure initialization
        const notificationId = snapshot.id;
        console.log(`[START] sendPushNotificationV2 triggered for ID: ${notificationId}`);
        const notification = snapshot.data();
        const userId = notification.userId;

        if (!userId) {
            console.error(`[ERROR] No userId found in notification: ${notificationId}`);
            return;
        }

        const userRef = admin.firestore().collection("users").doc(userId);
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        if (!userData || !userData.fcmTokens || !Array.isArray(userData.fcmTokens) || userData.fcmTokens.length === 0) {
            console.log(`[INFO] No FCM tokens found for user: ${userId}`);
            return;
        }

        const tokens = userData.fcmTokens;
        console.log(`[INFO] Found ${tokens.length} tokens for user: ${userId}`);

        let successCount = 0;
        let failureCount = 0;

        for (const token of tokens) {
            if (!token || typeof token !== "string") continue;

            const dataPayload: Record<string, string> = {
                notificationId: notificationId,
                type: notification.type || "generic"
            };

            if (notification.data) {
                Object.entries(notification.data).forEach(([key, value]) => {
                    dataPayload[key] = typeof value === 'string' ? value : JSON.stringify(value);
                });
            }

            const message: admin.messaging.Message = {
                token: token,
                notification: {
                    title: notification.title,
                    body: notification.message || "New notification!",
                },
                data: dataPayload,
                webpush: {
                    fcmOptions: {
                        link: 'https://wishu-c16d5.web.app/'
                    }
                }
            };

            try {
                const response = await admin.messaging().send(message);
                console.log(`[SUCCESS] Notification sent to token ${token.substring(0, 10)}... | Msg ID: ${response}`);
                successCount++;
            } catch (error: any) {
                failureCount++;
                console.error(`[ERROR] Failed to send to token ${token.substring(0, 10)}...`, error);

                if (error.code === 'messaging/registration-token-not-registered' ||
                    error.code === 'messaging/invalid-registration-token') {
                    console.log(`[CLEANUP] Removing invalid token: ${token}`);
                    try {
                        await userRef.update({
                            fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                        });
                        console.log(`[CLEANUP] Token removed successfully.`);
                    } catch (cleanupError) {
                        console.error(`[CLEANUP ERROR] Failed to remove token: ${token}`, cleanupError);
                    }
                }
            }
        }

        console.log(`[SUMMARY] Finished sending. Success: ${successCount}, Failed: ${failureCount}`);
    });

/**
 * Simple Test Function for Discovery
 */
export const testDiscovery = functions
    .region("us-central1")
    .https.onRequest((req, res) => {
        res.send("Discovery Works!");
    });


/**
 * V1 Function: Create Wishlist
 * Creates a new wishlist document in Firestore.
 */
export const createWishlist = functions
    .region("us-central1") // Explicitly set to us-central1 as requested
    .runWith(runtimeOpts)
    .https.onRequest(async (req, res) => {
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
            getAdmin(); // Ensure initialization
            const { title, description, occassion, date } = req.body;

            // Basic Validation
            if (!title) {
                res.status(400).send({ error: "Missing required field: title" });
                return;
            }

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
