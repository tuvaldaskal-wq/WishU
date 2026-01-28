/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any };

// 1. ניקוי קבצים ישנים וטעינת ה-Manifest של Vite
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// 2. האזנה לפושים גולמיים (Raw Push)
self.addEventListener('push', (event) => {
    console.log('[sw.ts] Push event received');

    let title = 'WishU';
    let options: any = {
        body: 'יש לך עדכון חדש באפליקציה!',
        icon: '/pwa-192x192-v2.png',
        badge: '/favicon.ico',
        data: { url: '/' }
    };

    if (event.data) {
        try {
            const data = event.data.json();
            title = data.title || data.notification?.title || title;
            options.body = data.body || data.notification?.body || options.body;
            if (data.data) options.data = data.data;
        } catch (e) {
            options.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 3. טיפול בלחיצה
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.openWindow(event.notification.data?.url || '/')
    );
});
