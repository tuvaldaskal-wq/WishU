import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export interface ScrapedData {
    title: string;
    description: string;
    image: string;
    url: string;
    price?: string;
    currency?: string;
    isBlocked?: boolean;
    message?: string;
    priceSource?: 'meta' | 'jsonld' | 'regex' | 'html' | 'api' | 'none';
}

// Known domains that are completely blocked even with premium proxies
// Akamai's protection is too aggressive for ScrapingBee to bypass
const BLOCKED_DOMAINS = [
    'hm.com',
    'adidas.co.il',  // Akamai blocks even with premium proxies
    'adidas.com',    // Akamai blocks even with premium proxies
    'zara.com',      // Heavy Akamai protection
];

const isBlockedDomain = (url: string): boolean => {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return BLOCKED_DOMAINS.some(domain => hostname.includes(domain));
    } catch {
        return false;
    }
};

/**
 * Clean URL: Remove tracking parameters
 */
const cleanUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);
        const paramsToRemove: string[] = [];

        urlObj.searchParams.forEach((_, key) => {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey.startsWith('utm_') ||
                lowerKey === 'fbclid' ||
                lowerKey === 'gclid' ||
                lowerKey === 'msclkid' ||
                lowerKey.startsWith('mc_') ||
                lowerKey.startsWith('_ga') ||
                lowerKey === 'affiliate' ||
                lowerKey === 'clickid'
            ) {
                paramsToRemove.push(key);
            }
        });

        paramsToRemove.forEach(key => urlObj.searchParams.delete(key));
        return urlObj.toString();
    } catch {
        return url;
    }
};

// Type for cloud function response
interface CloudFunctionResult {
    title: string;
    description: string;
    image: string;
    price?: string;
    currency?: string;
    priceSource?: string;
    error?: string;
}

/**
 * Fetch using Firebase Cloud Function (bypasses CORS, uses ScrapingBee premium)
 * This is the ONLY scraping method - no fallbacks to avoid timeouts
 */
const fetchWithCloudFunction = async (url: string): Promise<CloudFunctionResult | null> => {
    console.log("Scraper: Calling Firebase Cloud Function for:", url);

    try {
        // Direct HTTPS call instead of onCall to handle CORS better
        const response = await fetch('https://europe-west1-wishu-c16d5.cloudfunctions.net/scrapeProductDetails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }) // Send as simple JSON body
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Scraper: Cloud function failed with status", response.status, errorText);
            return null;
        }

        const data = await response.json() as CloudFunctionResult;
        console.log("Scraper: Cloud function returned:", data);

        if (data.error) {
            console.warn("Scraper: Cloud function error:", data.error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Scraper: Cloud function failed:", error);
        return null;
    }
};

export const fetchMetadata = async (url: string): Promise<ScrapedData | null> => {
    console.log("Scraper: Starting fetch for URL:", url);

    try {
        if (!url) {
            console.log("Scraper: Empty URL provided");
            return null;
        }

        // Check for blocked domains
        if (isBlockedDomain(url)) {
            console.log("Scraper: Blocked domain:", url);
            return {
                title: '',
                description: '',
                image: '',
                url: url,
                isBlocked: true,
                message: 'This site blocks automated access. Please enter details manually.',
                priceSource: 'none'
            };
        }

        // Clean URL from tracking params
        const cleanedUrl = cleanUrl(url);

        // Call Firebase Cloud Function (ScrapingBee via backend)
        // No Microlink fallback - just use the premium scraper
        const result = await fetchWithCloudFunction(cleanedUrl);

        if (result && (result.title || result.price)) {
            console.log("Scraper: Success!", {
                title: result.title?.substring(0, 50),
                price: result.price
            });

            return {
                title: result.title,
                description: result.description,
                image: result.image,
                url: cleanedUrl,
                price: result.price,
                currency: result.currency,
                isBlocked: false,
                priceSource: result.priceSource as ScrapedData['priceSource'],
            };
        }

        // Cloud function failed or returned no data
        console.warn("Scraper: No data from cloud function");
        return {
            title: '',
            description: '',
            image: '',
            url: url,
            isBlocked: true,
            message: 'Could not fetch product details. Please enter manually.',
            priceSource: 'none'
        };

    } catch (error) {
        console.error("Scraper failed:", error);
        return {
            title: '',
            description: '',
            image: '',
            url: url,
            isBlocked: true,
            message: 'We couldn\'t grab the details automatically. Please enter them manually.',
            priceSource: 'none'
        };
    }
};
