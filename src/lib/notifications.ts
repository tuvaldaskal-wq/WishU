// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '../lib/firebase';

interface ImportantDate {
    title: string;
    date: string;
}

export const checkAndSendNotifications = async (dates: ImportantDate[]) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    // Normalize "now" to midnight for accurate day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    dates.forEach(event => {
        const eventDate = new Date(event.date);
        // Annual event logic: Set to current year
        const currentYearEvent = new Date(now.getFullYear(), eventDate.getMonth(), eventDate.getDate());

        // Use 'time' difference to count days accurately
        const diffTime = currentYearEvent.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let body = '';
        if (diffDays === 7) {
            body = `${event.title} is in 7 days! Time to get a gift? 🎁`;
        } else if (diffDays === 1) {
            body = `${event.title} is tomorrow! Don't forget! ⏰`;
        } else if (diffDays === 0) {
            body = `${event.title} is TODAY! 🎉`;
        }

        if (body) {
            // Simple dedupe: Check if we already showed this notification today
            // In a real app, storing this in localStorage with a timestamp key is better
            const key = `notif_${event.title}_${now.toDateString()}`;
            if (!localStorage.getItem(key)) {
                new Notification("Upcoming Event", {
                    body: body,
                    icon: '/icon-192.png' // Ensure this exists or use a placeholder
                });
                localStorage.setItem(key, 'true');
            }
        }
    });
};

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
};
