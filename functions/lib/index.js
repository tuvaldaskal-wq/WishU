"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotificationV2 = exports.pingV2 = exports.scrapeProductDetails = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const options_1 = require("firebase-functions/v2/options");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================
function getAdmin() {
    if (firebase_admin_1.default.apps.length === 0) {
        firebase_admin_1.default.initializeApp({
            projectId: 'wishu-c16d5'
        });
    }
    return firebase_admin_1.default;
}
// Set Global Options for ALL V2 functions in this file
(0, options_1.setGlobalOptions)({
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60
});
// ScrapingBee API configuration
const SCRAPINGBEE_API_URL = "https://app.scrapingbee.com/api/v1/";
// ============================================================================
// HELPERS
// ============================================================================
// Site-specific CSS selectors for element-based waiting
const WAIT_FOR_SELECTORS = {
    "adidas.": ".product-description,.product-row,.gl-product-card,.product-details",
    "zara.": ".product-detail,.product-card,[data-qa=\"product-price\"]",
    "nike.": ".product-info,.product-card,.css-b9fpep",
    "hm.": ".product-item,.product-detail,.pdp-content",
    "shein.": ".product-info,.goods-detail,.product-intro",
};
function getWaitForSelector(url) {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        for (const [domain, selector] of Object.entries(WAIT_FOR_SELECTORS)) {
            if (hostname.includes(domain))
                return selector;
        }
    }
    catch { }
    return null;
}
function isBlockPage(html) {
    const lower = html.toLowerCase();
    const textIndicators = [
        "akamai", "access denied", "bot protection", "verify you are a human",
        "security check", "please enable javascript", "enable cookies",
        "reference id:", "cloudflare",
    ];
    if (textIndicators.some(i => lower.includes(i)))
        return true;
    if (html.includes("akamai.com") || html.includes("akamai-logo"))
        return true;
    return false;
}
function cleanUrl(url) {
    try {
        const u = new URL(url);
        ["utm_source", "utm_medium", "utm_campaign", "fbclid", "gclid"].forEach(p => u.searchParams.delete(p));
        return u.toString();
    }
    catch {
        return url;
    }
}
function extractTitle(html) {
    const match = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return match ? match[1].trim() : "";
}
function extractDescription(html) {
    const match = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1] : "";
}
function extractImage(html) {
    const match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]*property=["']product:image["'][^>]*content=["']([^"']+)["']/i);
    return match ? match[1] : "";
}
function normalizePrice(price, currency) {
    if (!price)
        return "";
    let cleanPrice = price.trim();
    if (/[₪$€£]/.test(cleanPrice))
        return cleanPrice;
    const currencySymbols = {
        ILS: "₪", NIS: "₪", USD: "$", EUR: "€", GBP: "£",
    };
    const symbol = currency ? (currencySymbols[currency.toUpperCase()] || currency) : "₪";
    return symbol === "₪" ? `${cleanPrice}${symbol}` : `${symbol}${cleanPrice}`;
}
function findPricesInObject(obj, prices, depth) {
    if (depth > 15 || !obj)
        return;
    if (Array.isArray(obj)) {
        obj.forEach(item => findPricesInObject(item, prices, depth + 1));
        return;
    }
    if (typeof obj !== "object")
        return;
    const objType = obj["@type"];
    const isOffer = objType === "Offer" || objType === "AggregateOffer";
    const isProduct = objType === "Product";
    if (obj.price !== undefined && obj.price !== null) {
        const priceVal = String(obj.price);
        if (/\d/.test(priceVal)) {
            prices.push({
                price: priceVal,
                currency: obj.priceCurrency || "ILS",
                confidence: isOffer ? 100 : isProduct ? 80 : 50
            });
        }
    }
    if (obj.lowPrice !== undefined) {
        prices.push({
            price: String(obj.lowPrice),
            currency: obj.priceCurrency || "ILS",
            confidence: isOffer ? 90 : 40
        });
    }
    if (obj.highPrice !== undefined) {
        prices.push({
            price: String(obj.highPrice),
            currency: obj.priceCurrency || "ILS",
            confidence: 30
        });
    }
    for (const key of Object.keys(obj)) {
        if (obj[key] && typeof obj[key] === "object") {
            findPricesInObject(obj[key], prices, depth + 1);
        }
    }
}
function extractPrice(html) {
    console.log("extractPrice: Starting price extraction...");
    // 1. Meta Tags
    let m = html.match(/<meta[^>]*property=["'](og:price:amount|product:price:amount)["'][^>]*content=["']([^"']+)["']/i);
    if (m && /\d/.test(m[2])) {
        console.log("extractPrice: Found meta tag price:", m[2]);
        let cur = "ILS";
        const curMatch = html.match(/<meta[^>]*property=["'](og:price:currency|product:price:currency)["'][^>]*content=["']([^"']+)["']/i);
        if (curMatch)
            cur = curMatch[2];
        return { price: m[2], currency: cur, source: "meta" };
    }
    // 2. JSON-LD
    console.log("extractPrice: Searching JSON-LD...");
    try {
        const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        const allPrices = [];
        while ((match = regex.exec(html)) !== null) {
            try {
                const jsonStr = match[1].trim();
                const parsed = JSON.parse(jsonStr);
                findPricesInObject(parsed, allPrices, 0);
            }
            catch (e) { }
        }
        if (allPrices.length > 0) {
            allPrices.sort((a, b) => b.confidence - a.confidence);
            console.log("extractPrice: Found JSON-LD prices:", allPrices);
            return { price: allPrices[0].price, currency: allPrices[0].currency || "ILS", source: "jsonld" };
        }
    }
    catch (e) {
        console.log("extractPrice: JSON-LD extraction error:", e);
    }
    // 3. HTML Patterns
    console.log("extractPrice: Trying HTML class patterns...");
    const htmlPatterns = [
        /class="[^"]*price[^"]*"[^>]*>([^<]*₪[^<]*|\d{1,3}[,.]?\d*[^<]*₪)/gi,
        /class="[^"]*gl-price[^"]*"[^>]*>([^<]+)/gi,
        /data-testid="[^"]*price[^"]*"[^>]*>([^<]+)/gi,
        /<span[^>]*class="[^"]*sale-price[^"]*"[^>]*>([^<]+)/gi,
        /<div[^>]*class="[^"]*product-price[^"]*"[^>]*>([^<]+)/gi,
    ];
    for (const pattern of htmlPatterns) {
        pattern.lastIndex = 0;
        const htmlMatch = pattern.exec(html);
        if (htmlMatch) {
            const priceText = htmlMatch[1].replace(/<[^>]+>/g, '').trim();
            const numMatch = priceText.match(/(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{1,2})?)/);
            if (numMatch) {
                console.log("extractPrice: Found HTML class price:", numMatch[1]);
                return { price: numMatch[1], currency: "ILS", source: "html" };
            }
        }
    }
    // 4. Regex Fallback
    console.log("extractPrice: Trying regex patterns...");
    const regexPatterns = [
        /₪\s*(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{1,2})?)/g,
        /(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{1,2})?)\s*₪/g,
        /(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{1,2})?)\s*ש"ח/g,
        /ILS\s*(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{1,2})?)/gi,
        /(\d{1,3}(?:[,.]?\d{3})*(?:[.,]\d{1,2})?)\s*ILS/gi,
    ];
    for (const pattern of regexPatterns) {
        pattern.lastIndex = 0;
        const regexMatch = pattern.exec(html);
        if (regexMatch) {
            const price = regexMatch[1];
            const priceNum = parseFloat(price.replace(/,/g, ''));
            if (priceNum > 0 && priceNum < 100000) {
                console.log("extractPrice: Found regex price:", price);
                return { price, currency: "ILS", source: "regex" };
            }
        }
    }
    return { source: "none" };
}
// ============================================================================
// FUNCTIONS
// ============================================================================
/**
 * V2 Function: Scrape Product Details
 * Uses onCall from firebase-functions/v2/https
 */
const scrapeProductDetails = (0, https_1.onCall)(async (request) => {
    getAdmin(); // Ensure initialization
    // In V2, data is accessed via request.data
    const data = request.data;
    const url = data.url;
    if (!url)
        return { title: "", description: "", image: "", error: "No URL" };
    const apiKey = process.env.SCRAPINGBEE_API_KEY;
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
            currency: priceData.currency,
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
exports.scrapeProductDetails = scrapeProductDetails;
/**
 * V2 Function: Health Check Ping
 * Uses onRequest from firebase-functions/v2/https
 */
const pingV2 = (0, https_1.onRequest)((req, res) => {
    getAdmin(); // Ensure initialization
    console.log("Ping triggered!");
    res.send("Pong v2 Europe!");
});
exports.pingV2 = pingV2;
/**
 * V2 Function: Send Push Notifications
 * Triggered by creation of documents in 'notifications' collection.
 * Uses onDocumentCreated from firebase-functions/v2/firestore
 */
const sendPushNotificationV2 = (0, firestore_1.onDocumentCreated)("notifications/{notificationId}", async (event) => {
    getAdmin(); // Ensure initialization
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No data associated with the event");
        return;
    }
    const notificationId = snapshot.id;
    console.log(`[START] sendPushNotificationV2 triggered for ID: ${notificationId}`);
    const notification = snapshot.data();
    const userId = notification.userId;
    if (!userId) {
        console.error(`[ERROR] No userId found in notification: ${notificationId}`);
        return;
    }
    const userRef = firebase_admin_1.default.firestore().collection("users").doc(userId);
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
            const response = await firebase_admin_1.default.messaging().send(message);
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
                        fcmTokens: firebase_admin_1.default.firestore.FieldValue.arrayRemove(token)
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
exports.sendPushNotificationV2 = sendPushNotificationV2;
//# sourceMappingURL=index.js.map