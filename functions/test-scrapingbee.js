// Test ScrapingBee directly with Amazon
import { gotScraping } from 'got-scraping';
import fs from 'fs';
import path from 'path';

const SCRAPINGBEE_API_URL = "https://app.scrapingbee.com/api/v1/";
const testUrl = "https://www.amazon.com/dp/B0BS9SDW8N";

async function test() {
    let apiKey = process.env.SCRAPINGBEE_API_KEY;

    if (!apiKey) {
        try {
            const configPath = path.resolve('./.runtimeconfig.json');
            if (fs.existsSync(configPath)) {
                // Handle potential UTF-16 LE encoding from PowerShell redirection
                let content = fs.readFileSync(configPath).toString('binary');
                // Check if it looks like UTF-16 (lots of null bytes)
                if (content.indexOf('\u0000') !== -1) {
                    content = content.replace(/\u0000/g, '');
                }
                const config = JSON.parse(content);
                apiKey = config.scrapingbee?.api_key;
                console.log("Loaded API key from .runtimeconfig.json");
            }
        } catch (e) {
            console.warn("Could not read .runtimeconfig.json", e);
        }
    }

    if (!apiKey) {
        console.error("ERROR: Could not find ScrapingBee API key in env or .runtimeconfig.json");
        process.exit(1);
    }

    console.log("Testing ScrapingBee with Amazon...");
    console.log("URL:", testUrl);

    const params = {
        api_key: apiKey,
        url: testUrl,
        render_js: "true",
        premium_proxy: "true",
        stealth_proxy: "true",
        country_code: "us",
        wait: "5000",
        wait_browser: "networkidle0",
    };

    try {
        const response = await gotScraping({
            url: SCRAPINGBEE_API_URL,
            searchParams: params,
            responseType: "text",
            timeout: { request: 60000 },
        });

        const html = response.body;
        console.log("\n=== SUCCESS ===");
        console.log("HTML Length:", html.length);
        console.log("\nFirst 1000 chars:");
        console.log(html.substring(0, 1000));

        const priceMatch = html.match(/\$(\d+(?:\.\d{2})?)/);
        if (priceMatch) {
            console.log("\n=== PRICE FOUND ===");
            console.log("Price:", priceMatch[0]);
        } else {
            console.log("\n=== NO PRICE FOUND ===");
            const metaMatch = html.match(/<meta[^>]*property=["']og:price:amount["'][^>]*content=["']([^"']+)["']/i);
            if (metaMatch) {
                console.log("Meta price:", metaMatch[1]);
            }
        }

    } catch (error) {
        console.error("\n=== FAILED ===");
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Status:", error.response.statusCode);
            console.error("Body:", error.response.body?.substring?.(0, 500));
        }
    }
}

test();
