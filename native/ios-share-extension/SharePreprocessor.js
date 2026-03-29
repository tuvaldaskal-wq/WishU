/**
 * SharePreprocessor.js
 *
 * This file runs inside Safari on the LIVE product page DOM before the
 * Share Extension UI appears. It extracts product data and passes it to
 * the Swift ShareViewController via `extensionContext.completeRequest`.
 *
 * Referenced in Info.plist as NSExtensionJavaScriptPreprocessingFile.
 */
var WishUExtension = class {
    run(arguments) {
        const doc = document;

        // ── URL ─────────────────────────────────────────────────────────────
        const pageUrl = doc.location.href;

        // ── Title ────────────────────────────────────────────────────────────
        // Try OG title first, fall back to document.title
        const ogTitle = doc.querySelector('meta[property="og:title"]')?.content
            || doc.querySelector('meta[name="og:title"]')?.content;
        const title = ogTitle || doc.title || '';

        // ── Image ─────────────────────────────────────────────────────────────
        const ogImage = doc.querySelector('meta[property="og:image"]')?.content
            || doc.querySelector('meta[property="og:image:secure_url"]')?.content
            || doc.querySelector('meta[name="og:image"]')?.content;
        let image = ogImage || '';
        // Fix protocol-relative URLs
        if (image.startsWith('//')) image = 'https:' + image;

        // ── Price ─────────────────────────────────────────────────────────────
        let price = '';

        // 1. JSON-LD structured data (most reliable)
        const jsonLdTags = doc.querySelectorAll('script[type="application/ld+json"]');
        for (const tag of jsonLdTags) {
            try {
                const data = JSON.parse(tag.textContent || '{}');
                const items = Array.isArray(data) ? data : [data];
                for (const item of items) {
                    const offers = item.offers || item['@graph']?.find(g => g['@type'] === 'Offer');
                    if (offers) {
                        const offer = Array.isArray(offers) ? offers[0] : offers;
                        const p = offer.price || offer.lowPrice;
                        const currency = offer.priceCurrency || '';
                        if (p) {
                            price = currency ? `${p} ${currency}` : String(p);
                            break;
                        }
                    }
                }
            } catch (e) { /* ignore parse errors */ }
            if (price) break;
        }

        // 2. Meta tags
        if (!price) {
            price = doc.querySelector('meta[property="product:price:amount"]')?.content
                || doc.querySelector('meta[property="og:price:amount"]')?.content
                || doc.querySelector('meta[itemprop="price"]')?.content
                || '';
        }

        // 3. Common DOM selectors for Israeli/international e-commerce sites
        if (!price) {
            const selectors = [
                '[itemprop="price"]',
                '.price',
                '.product-price',
                '.pdp-price',
                '[data-testid="price"]',
                '[class*="Price"]',
                '[class*="price"]',
                // Israeli sites
                '.price-value',
                '.price-il',
                '.product__price',
            ];
            for (const sel of selectors) {
                const el = doc.querySelector(sel);
                if (el) {
                    const text = (el.getAttribute('content') || el.textContent || '').trim();
                    if (text && /[\d]/.test(text)) {
                        price = text.replace(/\s+/g, ' ').trim();
                        break;
                    }
                }
            }
        }

        // ── Return to Swift ───────────────────────────────────────────────────
        arguments.completionFunction({
            url: pageUrl,
            title: title,
            price: price,
            image: image,
        });
    }

    finalize(arguments) {
        // Called after the Swift extension completes.
        // Nothing needed here.
    }
};
