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
    timeoutSeconds: 120,
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
// AUTH & SECURITY HELPERS
// ============================================================================

/**
 * Verify Firebase ID token from Authorization header.
 * Returns the decoded token (with uid) or null if invalid.
 */
async function verifyAuth(req: functions.https.Request): Promise<admin.auth.DecodedIdToken | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        return await admin.auth().verifyIdToken(idToken);
    } catch {
        return null;
    }
}

/**
 * Validate that a URL is safe to fetch (no SSRF).
 * Blocks internal IPs, metadata endpoints, and non-http(s) schemes.
 */
function isSafeUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        // Only allow http and https
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return false;
        }
        const hostname = parsed.hostname.toLowerCase();
        // Block cloud metadata endpoints
        if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
            return false;
        }
        // Block localhost
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
            return false;
        }
        // Block private/internal IP ranges
        const parts = hostname.split('.');
        if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
            const first = parseInt(parts[0]);
            const second = parseInt(parts[1]);
            if (first === 10) return false;                              // 10.0.0.0/8
            if (first === 172 && second >= 16 && second <= 31) return false; // 172.16.0.0/12
            if (first === 192 && second === 168) return false;           // 192.168.0.0/16
            if (first === 169 && second === 254) return false;           // 169.254.0.0/16
        }
        return true;
    } catch {
        return false;
    }
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
    // International
    if (lowerUrl.includes("zara.com")) return ".product-detail-view__main-info";
    if (lowerUrl.includes("adidas")) return ".product-description";
    if (lowerUrl.includes("shein.com") || lowerUrl.includes("shein.co.il")) return ".product-intro";
    if (lowerUrl.includes("hm.com")) return "[data-testid=\"productName\"]";
    if (lowerUrl.includes("asos.com")) return "#product-details";
    // Israeli retailers
    if (lowerUrl.includes("terminalx.com")) return ".product-info-price";   // Magento
    if (lowerUrl.includes("ksp.co.il")) return ".price";
    if (lowerUrl.includes("ivory.co.il")) return ".price";
    if (lowerUrl.includes("bug.co.il")) return ".price";
    if (lowerUrl.includes("golf.co.il")) return ".product-price";
    if (lowerUrl.includes("castro.com")) return ".price";
    if (lowerUrl.includes("honigman.co.il")) return ".price";
    return null;
}

function isBlockPage(html: string): boolean {
    // Only flag genuine block pages, not pages that happen to mention these words in content
    // Check only a small window of the page (title + early body) to avoid false positives
    const sample = html.substring(0, 5000).toLowerCase();
    const hardBlockIndicators = [
        "are you a robot",
        "verify you are human",
        "ddos protection by cloudflare",
        "access denied",
        "403 forbidden",
        "enable javascript and cookies to continue",
    ];
    return hardBlockIndicators.some(indicator => sample.includes(indicator));
}

/** Decode HTML entities in a string (handles &amp; &quot; &#39; etc.) */
function decodeHtmlEntities(str: string): string {
    return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

/**
 * Extract content from a meta tag that matches a property OR name attribute.
 * Handles both orderings: <meta property="X" content="Y"> and <meta content="Y" property="X">
 */
function extractMetaContent(html: string, attribute: string, value: string): string {
    // Both orderings — use a two-step approach: find the whole tag, then extract content
    const tagRegex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${value}["'][^>]*>`,
        'i'
    );
    const tagMatch = html.match(tagRegex);
    if (tagMatch) {
        const contentMatch = tagMatch[0].match(/content=["']([^"']*?)["']/i);
        if (contentMatch?.[1]) return decodeHtmlEntities(contentMatch[1].trim());
    }
    return "";
}

function extractTitle(html: string): string {
    const og = extractMetaContent(html, 'property', 'og:title');
    if (og) return og;

    const twitter = extractMetaContent(html, 'name', 'twitter:title');
    if (twitter) return twitter;

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch?.[1]) {
        return decodeHtmlEntities(titleMatch[1].trim().split('|')[0].split(' - ')[0].trim());
    }

    return "";
}

function extractDescription(html: string): string {
    const og = extractMetaContent(html, 'property', 'og:description');
    if (og) return og;

    const meta = extractMetaContent(html, 'name', 'description');
    if (meta) return meta;

    return "";
}

function extractImage(html: string): string {
    // og:image (property or name variant)
    const ogImage = extractMetaContent(html, 'property', 'og:image');
    if (ogImage && (ogImage.startsWith('http') || ogImage.startsWith('//'))) {
        return ogImage.startsWith('//') ? 'https:' + ogImage : ogImage;
    }

    // twitter:image
    const twitterImage = extractMetaContent(html, 'name', 'twitter:image');
    if (twitterImage && (twitterImage.startsWith('http') || twitterImage.startsWith('//'))) {
        return twitterImage.startsWith('//') ? 'https:' + twitterImage : twitterImage;
    }

    // og:image:secure_url
    const secureUrl = extractMetaContent(html, 'property', 'og:image:secure_url');
    if (secureUrl && secureUrl.startsWith('http')) return secureUrl;

    // link[rel="image_src"]
    const linkMatch = html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i)
        || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']image_src["']/i);
    if (linkMatch?.[1] && linkMatch[1].startsWith('http')) return linkMatch[1];

    return "";
}

function extractPrice(html: string): { price: string | null; currency: string | null; source: string } {
    // 1. JSON-LD extraction (most reliable)
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
        try {
            const parsed = JSON.parse(match[1]);
            const price = findPriceInObject(parsed);
            if (price) return { ...price, source: "jsonld" };
        } catch { }
    }

    // 2. Meta tag: product:price:amount or og:price:amount
    const metaPrice = extractMetaContent(html, 'property', 'product:price:amount')
        || extractMetaContent(html, 'property', 'og:price:amount');
    const metaCurrency = extractMetaContent(html, 'property', 'product:price:currency')
        || extractMetaContent(html, 'property', 'og:price:currency');
    if (metaPrice) {
        return { price: metaPrice, currency: metaCurrency || "ILS", source: "meta" };
    }

    // 3. itemprop="price" in HTML
    const itempropMatch = html.match(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]*itemprop=["']price["']/i);
    if (itempropMatch?.[1]) {
        const itempropCurrency = html.match(/itemprop=["']priceCurrency["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/content=["']([^"']+)["'][^>]*itemprop=["']priceCurrency["']/i);
        return {
            price: itempropMatch[1],
            currency: itempropCurrency?.[1] || "ILS",
            source: "html"
        };
    }

    // 4. Regex: ₪ symbol only (avoid false-positives from "ILS"/"NIS" appearing in currency lists)
    const ilsMatch = html.match(/₪\s*([\d,]+(?:\.\d{2})?)|(?:[\d,]+(?:\.\d{2})?)\s*₪/);
    if (ilsMatch) {
        const cleanPrice = ilsMatch[0].replace(/[^\d.,]/g, '');
        return { price: cleanPrice, currency: "ILS", source: "regex" };
    }

    // 5. Regex: USD / $
    const usdMatch = html.match(/\$\s*([\d,]+(?:\.\d{2})?)|(?:USD)\s*([\d,]+(?:\.\d{2})?)/i);
    if (usdMatch) {
        const cleanPrice = (usdMatch[1] || usdMatch[2]).replace(/,/g, '');
        return { price: cleanPrice, currency: "USD", source: "regex" };
    }

    // 6. Regex: EUR / €
    const eurMatch = html.match(/€\s*([\d,]+(?:\.\d{2})?)|(?:EUR)\s*([\d,]+(?:\.\d{2})?)/i);
    if (eurMatch) {
        const cleanPrice = (eurMatch[1] || eurMatch[2]).replace(/,/g, '');
        return { price: cleanPrice, currency: "EUR", source: "regex" };
    }

    // 7. Regex: GBP / £
    const gbpMatch = html.match(/£\s*([\d,]+(?:\.\d{2})?)|(?:GBP)\s*([\d,]+(?:\.\d{2})?)/i);
    if (gbpMatch) {
        const cleanPrice = (gbpMatch[1] || gbpMatch[2]).replace(/,/g, '');
        return { price: cleanPrice, currency: "GBP", source: "regex" };
    }

    return { price: null, currency: null, source: "none" };
}

const CURRENCY_SYMBOLS: Record<string, string> = {
    ILS: "₪",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CAD: "CA$",
    AUD: "A$",
};

function findPriceInObject(obj: any, depth = 0): { price: string; currency: string } | null {
    if (depth > 10) return null;
    if (!obj || typeof obj !== "object") return null;

    const type = obj["@type"];

    // Direct Offer or Product with price
    if (type === "Offer" || type === "Product") {
        const directPrice = obj.price;
        if (directPrice !== undefined && directPrice !== null && directPrice !== "") {
            return {
                price: String(directPrice),
                currency: obj.priceCurrency || "ILS"
            };
        }
    }

    // Product with offers array or single offer
    if (type === "Product" && obj.offers) {
        const offers = Array.isArray(obj.offers) ? obj.offers : [obj.offers];
        for (const offer of offers) {
            if (offer && (offer.price !== undefined) && offer.price !== "") {
                return {
                    price: String(offer.price),
                    currency: offer.priceCurrency || "ILS"
                };
            }
            // priceSpecification inside offer
            if (offer?.priceSpecification) {
                const spec = Array.isArray(offer.priceSpecification)
                    ? offer.priceSpecification[0]
                    : offer.priceSpecification;
                if (spec?.price) {
                    return { price: String(spec.price), currency: spec.priceCurrency || "ILS" };
                }
            }
        }
    }

    // Recurse into arrays and objects
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
    const cleaned = price.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    if (isNaN(num)) return price;
    const sym = CURRENCY_SYMBOLS[currency || "ILS"] || (currency || "₪");
    // Put symbol before for $, €, £, after for ₪
    if (currency === "ILS" || !currency) {
        return `${num % 1 === 0 ? num : num.toFixed(2)}₪`;
    }
    return `${sym}${num % 1 === 0 ? num : num.toFixed(2)}`;
}

// ============================================================================
// TIERED SCRAPING HELPERS
// ============================================================================

// Domains that require ScrapingBee (heavy anti-bot protection)
const PREMIUM_REQUIRED_DOMAINS = [
    'zara.com', 'adidas.co.il', 'adidas.com', 'hm.com',
    'shein.com', 'shein.co.il', 'asos.com', 'nike.com'
];

function requiresPremiumScraper(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return PREMIUM_REQUIRED_DOMAINS.some(domain => lowerUrl.includes(domain));
}

// ============================================================================
// TIER 0: Shopify Native API (free, reliable, no scraping needed)
// ============================================================================

/**
 * Detects if a URL is a Shopify product page and returns product data
 * directly from the Shopify JSON API — no scraping, no bot detection, exact prices.
 */
async function tier0Shopify(url: string): Promise<ScrapedResult | null> {
    // Must contain /products/ to be a product page
    const handleMatch = url.match(/\/products\/([a-zA-Z0-9][a-zA-Z0-9\-_]*)/);
    if (!handleMatch) return null;

    const handle = handleMatch[1];
    let baseUrl: string;
    try {
        const u = new URL(url);
        baseUrl = `${u.protocol}//${u.hostname}`;
    } catch {
        return null;
    }

    const apiUrl = `${baseUrl}/products/${handle}.json`;
    console.log("[Tier 0] Trying Shopify API:", apiUrl);

    try {
        const response = await axios.get(apiUrl, {
            timeout: 8000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; WishU/1.0)',
            }
        });

        const product = response.data?.product;
        if (!product?.title) {
            console.log("[Tier 0] Not a Shopify store or no product found");
            return null;
        }

        // Pick the first available variant price
        const variant = product.variants?.[0];
        const rawPrice = variant?.price || "";
        const image = product.images?.[0]?.src || "";

        // Strip HTML from body_html for description
        const description = (product.body_html || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .substring(0, 300);

        const price = rawPrice ? normalizePrice(rawPrice, "ILS") : "";

        console.log("[Tier 0] Shopify success! Title:", product.title.substring(0, 50), "Price:", price);
        return {
            title: product.title,
            description,
            image,
            price,
            currency: "ILS",
            priceSource: "api",
            _debug: { tier: 0, source: "shopify-api" }
        };
    } catch (error) {
        // 404 = not Shopify or product doesn't exist, silently fail
        console.log("[Tier 0] Shopify API failed:", axios.isAxiosError(error) ? error.response?.status || error.message : "unknown");
        return null;
    }
}

// Tier 1: Direct fetch with browser-like headers
async function tier1DirectFetch(url: string): Promise<ScrapedResult | null> {
    console.log("[Tier 1] Attempting direct fetch for:", url);
    try {
        const response = await axios.get(url, {
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5,he;q=0.3',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            maxRedirects: 5,
        });

        const html = response.data;
        if (!html || typeof html !== 'string' || html.length < 500) {
            console.log("[Tier 1] Response too short or not HTML");
            return null;
        }

        if (isBlockPage(html)) {
            console.log("[Tier 1] Blocked by WAF");
            return null;
        }

        const title = extractTitle(html);
        const image = extractImage(html);

        // Need at least title or image to consider this successful
        if (!title && !image) {
            console.log("[Tier 1] No useful data extracted");
            return null;
        }

        const description = extractDescription(html);
        const priceData = extractPrice(html);

        console.log("[Tier 1] Success! Title:", title?.substring(0, 50));
        return {
            title,
            description,
            image,
            price: normalizePrice(priceData.price || "", priceData.currency),
            currency: priceData.currency || undefined,
            priceSource: priceData.source,
            _debug: { tier: 1, htmlLength: html.length }
        };
    } catch (error) {
        console.log("[Tier 1] Failed:", axios.isAxiosError(error) ? error.message : "Unknown error");
        return null;
    }
}

// Tier 2: Microlink API (free tier: 50 req/day)
async function tier2Microlink(url: string): Promise<ScrapedResult | null> {
    console.log("[Tier 2] Attempting Microlink for:", url);
    try {
        const response = await axios.get('https://api.microlink.io', {
            params: { url, palette: false, audio: false, video: false },
            timeout: 12000,
        });

        const data = response.data?.data;
        if (!data) {
            console.log("[Tier 2] No data in response");
            return null;
        }

        const title = data.title || "";
        const description = data.description || "";
        const image = data.image?.url || "";

        if (!title && !image) {
            console.log("[Tier 2] No useful data extracted");
            return null;
        }

        console.log("[Tier 2] Success! Title:", title?.substring(0, 50));
        return {
            title,
            description,
            image,
            price: "", // Microlink doesn't extract prices
            priceSource: "none",
            _debug: { tier: 2 }
        };
    } catch (error) {
        console.log("[Tier 2] Failed:", axios.isAxiosError(error) ? error.message : "Unknown error");
        return null;
    }
}

// Tier 3: ScrapingBee (premium, uses credits)
async function tier3ScrapingBee(url: string, apiKey: string): Promise<ScrapedResult | null> {
    console.log("[Tier 3] Attempting ScrapingBee for:", url);

    const params: any = {
        api_key: apiKey,
        url: url,
        render_js: "true",
        premium_proxy: "true",
        stealth_proxy: "true",
        country_code: "il",
        wait: "3000",           // Fixed 3s wait instead of networkidle0 (much faster)
        window_width: "1920",
        window_height: "1080",
        device: "desktop",
    };

    const selector = getWaitForSelector(url);
    if (selector) params.wait_for = selector;

    try {
        const response = await axios.get(SCRAPINGBEE_API_URL, {
            params,
            timeout: 35000,     // 35s — leaves headroom within the 120s function budget
        });

        const html = response.data;
        if (!html || html.length < 500) {
            console.log("[Tier 3] Response too short");
            return null;
        }

        if (isBlockPage(html)) {
            console.log("[Tier 3] Blocked by WAF");
            return null;
        }

        const title = extractTitle(html);
        const description = extractDescription(html);
        const image = extractImage(html);
        const priceData = extractPrice(html);

        console.log("[Tier 3] Success! Title:", title?.substring(0, 50));
        return {
            title,
            description,
            image,
            price: normalizePrice(priceData.price || "", priceData.currency),
            currency: priceData.currency || undefined,
            priceSource: priceData.source,
            _debug: { tier: 3, htmlLength: html.length }
        };
    } catch (error) {
        console.error("[Tier 3] Failed:", error);
        if (axios.isAxiosError(error)) {
            console.error("[Tier 3] Axios details:", {
                status: error.response?.status,
                message: error.message,
                data: typeof error.response?.data === 'string'
                    ? error.response.data.substring(0, 200)
                    : error.response?.data
            });
        }
        return null;
    }
}

// ============================================================================
// FUNCTIONS
// ============================================================================

console.log("MODULE_LOADED: functions/src/index.ts VERSION 5 (SHOPIFY API + HYBRID SCRAPER)");

/**
 * V1 Function: Scrape Product Details (Tiered)
 * Tier 1: Direct fetch + meta extraction (free)
 * Tier 2: Microlink API (free tier)
 * Tier 3: ScrapingBee (premium, uses credits)
 */
export const scrapeProductDetails = functions
    .region(REGION)
    .runWith(runtimeOpts)
    .https.onRequest(async (req, res) => {
        // STRICT CORS HANDLING - MUST BE FIRST
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

        // Authenticate the caller
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            res.status(401).send({ error: "Unauthorized: valid Firebase ID token required" });
            return;
        }

        const body = req.body;
        const url = (body.data && body.data.url) ? body.data.url : body.url;

        if (!url) {
            res.status(400).send({ title: "", description: "", image: "", error: "No URL" });
            return;
        }

        // SSRF protection: block internal/metadata URLs
        if (!isSafeUrl(url)) {
            res.status(400).send({ title: "", description: "", image: "", error: "Invalid URL" });
            return;
        }

        const cleanedUrl = cleanUrl(url);
        console.log(`Processing URL: ${cleanedUrl}`);

        let result: ScrapedResult | null = null;

        // ── Tier 0: Shopify native API (fastest, most accurate, no bot risk) ──
        result = await tier0Shopify(cleanedUrl);
        if (result) {
            console.log("Tier 0 (Shopify API) succeeded — skipping scraping");
            res.status(200).send(result);
            return;
        }

        // Check if this domain requires premium scraper for everything
        const needsPremium = requiresPremiumScraper(cleanedUrl);

        if (needsPremium) {
            console.log("Domain requires premium scraper, using ScrapingBee for everything");
            const apiKey = functions.config().scrapingbee?.api_key || process.env.SCRAPINGBEE_API_KEY;
            if (apiKey) {
                result = await tier3ScrapingBee(cleanedUrl, apiKey);
            }
        } else {
            // HYBRID APPROACH: Free scrapers for title/image, ScrapingBee for price only

            // Step 1: Try Tier 1 (direct fetch) for title, image, and potentially price
            result = await tier1DirectFetch(cleanedUrl);

            // Step 2: If Tier 1 failed completely, try Tier 2 (Microlink)
            if (!result) {
                result = await tier2Microlink(cleanedUrl);
            }

            // Step 3: If we got title/image but NO price, try ScrapingBee for price only
            if (result && (result.title || result.image) && !result.price) {
                console.log("Got title/image from free tier, attempting ScrapingBee for price only...");
                const apiKey = functions.config().scrapingbee?.api_key || process.env.SCRAPINGBEE_API_KEY;
                if (apiKey) {
                    const premiumResult = await tier3ScrapingBee(cleanedUrl, apiKey);
                    if (premiumResult && premiumResult.price) {
                        // Merge: keep free tier's title/image, use ScrapingBee's price
                        result.price = premiumResult.price;
                        result.currency = premiumResult.currency;
                        result.priceSource = premiumResult.priceSource;
                        result._debug = {
                            ...result._debug,
                            priceTier: 3,
                            note: "Title/image from free tier, price from ScrapingBee"
                        };
                        console.log("Merged price from ScrapingBee:", result.price);
                    } else {
                        console.log("ScrapingBee also couldn't extract price");
                    }
                }
            }

            // Step 4: If we still have no result at all, try ScrapingBee as full fallback
            if (!result) {
                console.log("Free tiers failed completely, falling back to ScrapingBee");
                const apiKey = functions.config().scrapingbee?.api_key || process.env.SCRAPINGBEE_API_KEY;
                if (apiKey) {
                    result = await tier3ScrapingBee(cleanedUrl, apiKey);
                } else {
                    console.warn("No ScrapingBee API key configured");
                }
            }
        }

        // Return result or error
        if (result && (result.title || result.image)) {
            res.status(200).send(result);
        } else {
            res.status(200).send({
                title: "",
                description: "",
                image: "",
                error: "Scraping failed - all tiers exhausted",
                errorCode: "SCRAPE_FAILED"
            });
        }
    });

/**
 * V1 Function: Search Users
 * Search all users by displayName or email (case-insensitive partial match)
 * Used for finding users who are not already friends
 */
export const searchUsers = functions
    .region(REGION)
    .runWith(runtimeOpts)
    .https.onRequest(async (req, res) => {
        // CORS
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        // Trigger deployment check
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.status(204).send('');
            return;
        }

        if (req.method !== 'POST') {
            res.status(405).send({ error: 'Method Not Allowed' });
            return;
        }

        getAdmin();

        // Authenticate the caller
        const decodedToken = await verifyAuth(req);
        if (!decodedToken) {
            res.status(401).send({ error: "Unauthorized: valid Firebase ID token required", users: [] });
            return;
        }

        const body = req.body;
        const query = (body.data?.query || body.query || '').toLowerCase().trim();
        const requesterId = decodedToken.uid;

        if (!query || query.length < 2) {
            res.status(400).send({ error: 'Query must be at least 2 characters', users: [] });
            return;
        }

        console.log(`[searchUsers] Searching for: "${query}" by user: ${requesterId}`);

        try {
            // Get all users (in production, use proper indexing/Algolia)
            const usersSnapshot = await admin.firestore().collection('users').get();

            const matchingUsers: any[] = [];

            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                const uid = doc.id;

                // Don't include the requester
                if (uid === requesterId) return;

                const displayName = (userData.displayName || '').toLowerCase();
                const email = (userData.email || '').toLowerCase();

                // Partial match on displayName or email
                if (displayName.includes(query) || email.includes(query)) {
                    matchingUsers.push({
                        uid,
                        displayName: userData.displayName || 'Unknown',
                        email: userData.email || '',
                        photoURL: userData.photoURL || null,
                    });
                }
            });

            // Limit to 10 results
            const results = matchingUsers.slice(0, 10);

            console.log(`[searchUsers] Found ${results.length} matches`);
            res.status(200).send({ users: results });

        } catch (error) {
            console.error('[searchUsers] Error:', error);
            res.status(500).send({ error: 'Search failed', users: [] });
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

            // Authenticate the caller
            const decodedToken = await verifyAuth(req);
            if (!decodedToken) {
                res.status(401).send({ error: "Unauthorized: valid Firebase ID token required" });
                return;
            }

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
                itemCount: 0,
                ownerId: decodedToken.uid
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
