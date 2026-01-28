// Test script to verify got-scraping can access Adidas API
import { gotScraping } from 'got-scraping';

const SKU = 'JQ2907';
const endpoint = `https://www.adidas.co.il/api/products/${SKU}`;

console.log(`Testing Adidas API for SKU: ${SKU}`);
console.log(`Endpoint: ${endpoint}`);

try {
    const response = await gotScraping({
        url: endpoint,
        method: "GET",
        responseType: "json",
        headers: {
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9,he;q=0.8",
            "Referer": "https://www.adidas.co.il/",
            "Origin": "https://www.adidas.co.il",
        },
        timeout: { request: 15000 },
    });

    console.log('\n=== SUCCESS ===');
    console.log('Status:', response.statusCode);
    console.log('Body type:', typeof response.body);
    console.log('Body preview:', JSON.stringify(response.body, null, 2).substring(0, 1000));

    const data = response.body;
    const product = data.product || data;

    console.log('\n=== EXTRACTED DATA ===');
    console.log('Name:', product.name);
    console.log('Price:', product.pricing?.currentPrice || product.price);
    console.log('Image:', product.view_list?.[0]?.image_url || product.image?.src);

} catch (error) {
    console.error('\n=== FAILED ===');
    console.error('Error:', error.message);
    if (error.response) {
        console.error('Status:', error.response.statusCode);
        console.error('Body:', error.response.body?.substring?.(0, 500) || error.response.body);
    }
}
