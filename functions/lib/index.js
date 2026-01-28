"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotificationV2 = exports.pingV2 = exports.scrapeProductDetails = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================
// Initialize Firebase Admin
admin.initializeApp();
// ScrapingBee API configuration
const SCRAPINGBEE_API_URL = "https://app.scrapingbee.com/api/v1/";
// Runtime options for functions
const runtimeOpts = {
    timeoutSeconds: 60,
    memory: "512MB"
};
// Region configuration
const REGION = "europe-west1";
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function cleanUrl(url) {
    let cleaned = url.trim();
    cleaned = cleaned.replace(/([?&])(utm_[^&]*|ref[^&]*|affiliate[^&]*|source[^&]*|fbclid[^&]*|gclid[^&]*|mc_[^&]*)/gi, '$1');
    cleaned = cleaned.replace(/[?&]+$/, '');
    cleaned = cleaned.replace(/\?&/, '?');
    return cleaned;
}
function getWaitForSelector(url) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("zara.com"))
        return ".product-detail-view__main-info";
    if (lowerUrl.includes("adidas"))
        return ".product-description";
    if (lowerUrl.includes("shein.com") || lowerUrl.includes("shein.co.il"))
        return ".product-intro";
    if (lowerUrl.includes("hm.com"))
        return "[data-testid=\"productName\"]";
    if (lowerUrl.includes("asos.com"))
        return "#product-details";
    return null;
}
function isBlockPage(html) {
    const blockIndicators = [
        "access denied", "are you a robot", "security check",
        "blocked", "captcha", "cloudflare", "ray id",
        "enable javascript", "403 forbidden"
    ];
    const lowerHtml = html.toLowerCase();
    return blockIndicators.some(indicator => lowerHtml.includes(indicator));
}
function extractTitle(html) {
    const ogMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    if (ogMatch?.[1])
        return ogMatch[1].trim();
    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i);
    if (twitterMatch?.[1])
        return twitterMatch[1].trim();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch?.[1])
        return titleMatch[1].trim().split('|')[0].split('-')[0].trim();
    return "";
}
function extractDescription(html) {
    const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
    if (ogMatch?.[1])
        return ogMatch[1].trim();
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (metaMatch?.[1])
        return metaMatch[1].trim();
    return "";
}
function extractImage(html) {
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
    if (ogMatch?.[1] && ogMatch[1].startsWith('http'))
        return ogMatch[1].trim();
    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i);
    if (twitterMatch?.[1] && twitterMatch[1].startsWith('http'))
        return twitterMatch[1].trim();
    return "";
}
function extractPrice(html) {
    // JSON-LD extraction
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
        try {
            const parsed = JSON.parse(match[1]);
            const price = findPriceInObject(parsed);
            if (price)
                return { ...price, source: "jsonld" };
        }
        catch { }
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
function findPriceInObject(obj, depth = 0) {
    if (depth > 10)
        return null;
    if (!obj || typeof obj !== "object")
        return null;
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
            if (result)
                return result;
        }
    }
    else {
        for (const key of Object.keys(obj)) {
            const result = findPriceInObject(obj[key], depth + 1);
            if (result)
                return result;
        }
    }
    return null;
}
function normalizePrice(price, currency) {
    if (!price)
        return "";
    let cleaned = price.replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (isNaN(num))
        return price;
    return `${num.toFixed(2)} ${currency || "₪"}`;
}
// ============================================================================
// FUNCTIONS
// ============================================================================
/**
 * V1 Function: Scrape Product Details
 */
exports.scrapeProductDetails = functions
    .region(REGION)
    .runWith(runtimeOpts)
    .https.onCall(async (data, context) => {
    const url = data.url;
    if (!url)
        return { title: "", description: "", image: "", error: "No URL" };
    const apiKey = functions.config().scrapingbee?.api_key;
    if (!apiKey)
        return { title: "", description: "", image: "", error: "Config missing" };
    const cleanedUrl = cleanUrl(url);
    console.log(`Processing URL: ${cleanedUrl}`);
    const params = {
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
    if (selector)
        params.wait_for = selector;
    try {
        console.log("Calling ScrapingBee via Axios...");
        const response = await axios_1.default.get(SCRAPINGBEE_API_URL, {
            params: params,
            timeout: 55000,
        });
        const html = response.data;
        if (!html || html.length < 500) {
            console.warn("ScrapingBee returned empty/short content");
            return { title: "", description: "", image: "", error: "Empty content", errorCode: "SCRAPE_FAILED" };
        }
        if (isBlockPage(html)) {
            console.warn("BLOCKED by WAF");
            return { title: "", description: "", image: "", error: "Blocked by WAF", errorCode: "SCRAPE_FAILED_MANUAL_REQUIRED" };
        }
        console.log("HTML received, length:", html.length);
        const title = extractTitle(html);
        const description = extractDescription(html);
        const image = extractImage(html);
        const priceData = extractPrice(html);
        return {
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
    }
    catch (error) {
        console.error("ScrapingBee call failed:", error);
        if (axios_1.default.isAxiosError(error) && (error.code === 'ECONNABORTED' || error.response?.status === 408)) {
            return { title: "", description: "", image: "", error: "Scraping timed out", errorCode: "SCRAPE_FAILED" };
        }
        return { title: "", description: "", image: "", error: "Scraping failed", errorCode: "SCRAPE_FAILED" };
    }
});
/**
 * V1 Function: Health Check Ping
 */
exports.pingV2 = functions
    .region(REGION)
    .runWith(runtimeOpts)
    .https.onRequest((req, res) => {
    console.log("Ping triggered!");
    res.send("Pong v1 Europe!");
});
/**
 * V1 Function: Send Push Notifications
 * Triggered by creation of documents in 'notifications' collection.
 */
exports.sendPushNotificationV2 = functions
    .region(REGION)
    .runWith(runtimeOpts)
    .firestore.document("notifications/{notificationId}")
    .onCreate(async (snapshot, context) => {
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
        if (!token || typeof token !== "string")
            continue;
        const dataPayload = {
            notificationId: notificationId,
            type: notification.type || "generic"
        };
        if (notification.data) {
            Object.entries(notification.data).forEach(([key, value]) => {
                dataPayload[key] = typeof value === 'string' ? value : JSON.stringify(value);
            });
        }
        const message = {
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
        }
        catch (error) {
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
                }
                catch (cleanupError) {
                    console.error(`[CLEANUP ERROR] Failed to remove token: ${token}`, cleanupError);
                }
            }
        }
    }
    console.log(`[SUMMARY] Finished sending. Success: ${successCount}, Failed: ${failureCount}`);
});
//# sourceMappingURL=index.js.map