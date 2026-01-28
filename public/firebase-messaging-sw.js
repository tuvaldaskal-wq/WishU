/* eslint-disable no-undef */
// This file is required by Firebase Messaging to handle background notifications.
// Even when using a custom service worker name (like sw.js from Vite-PWA), 
// keep this file in the public directory to prevent 404 errors.

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyB5IxD6TIYVHcQ1UHtGz9PRATJTK_QpOWs",
    authDomain: "wishu-c16d5.firebaseapp.com",
    projectId: "wishu-c16d5",
    storageBucket: "wishu-c16d5.firebasestorage.app",
    messagingSenderId: "159437089644",
    appId: "1:159437089644:web:3df478217e65a7d12fa149"
};

if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title || 'New WishU Notification';
    const notificationOptions = {
        body: payload.notification.body || 'You have a new update.',
        icon: '/pwa-192x192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);
    event.notification.close();

    event.waitUntil(clients.matchAll({
        type: "window",
        includeUncontrolled: true
    }).then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
            var client = clientList[i];
            if (client.url === '/' && 'focus' in client)
                return client.focus();
        }
        if (clients.openWindow)
            return clients.openWindow('/');
    }));
});
