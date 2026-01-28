import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function wrapAffiliateLink(originalUrl: string): string {
    if (!originalUrl) return '';
    try {
        const url = new URL(originalUrl);
        // Avoid double tagging or breaking non-http links
        if (!url.protocol.startsWith('http')) return originalUrl;

        // Simple append for MVP. In reality, would be store-specific logic (Amazon vs others)
        url.searchParams.set('tag', 'wishu-21');
        return url.toString();
    } catch (e) {
        return originalUrl;
    }
}

export function getNextEventDate(dateStr: string): { date: Date, daysLeft: number } | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3) return null; // simplistic validation

    const [_, m, day] = parts; // YYYY is ignored for recurrence
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextDate = new Date(today.getFullYear(), m - 1, day);

    // If passed, move to next year
    if (nextDate < today) {
        nextDate.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { date: nextDate, daysLeft };
}
