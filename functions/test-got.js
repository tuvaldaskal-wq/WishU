import { gotScraping } from 'got-scraping';

console.log('gotScraping imported successfully');

try {
    const response = await gotScraping('https://example.com');
    console.log('Request successful:', response.statusCode);
} catch (error) {
    console.error('Request failed:', error);
}
