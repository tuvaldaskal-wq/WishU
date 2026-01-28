import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch, limit, arrayUnion } from 'firebase/firestore';
import { db, messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { useAuth } from './AuthContext';

export interface Notification {
    id: string;
    userId: string;
    type: 'greeting' | 'birthday';
    title: string;
    message?: string;
    data: {
        greetingId?: string;
        senderName?: string;
        friendId?: string;
        friendName?: string;
        [key: string]: any;
    };
    read: boolean;
    createdAt: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    requestPermission: () => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];

            setNotifications(loadedNotifications);
            setUnreadCount(loadedNotifications.filter(n => !n.read).length);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Handle FCM Tokens and Permissions
    const requestPermission = async () => {
        if (!user) return;

        try {
            if (!('Notification' in window)) {
                console.log('This browser does not support desktop notification');
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log("Notification permission granted.");
                await setupMessagingToken(user.uid);
            } else {
                console.log("Notification permission not granted. Status:", permission);
            }
        } catch (error) {
            console.error("Error requesting notification permission:", error);
        }
    };

    const setupMessagingToken = async (uid: string) => {
        let registration;
        try {
            // Using navigator.serviceWorker.ready to get the registration from Vite-PWA
            registration = await navigator.serviceWorker.ready;
            console.log("Unified Service Worker ready:", registration);
        } catch (swError) {
            console.error("Service Worker retrieval failed:", swError);
            return;
        }

        // VAPID key from Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
        const vapidKey = "BOg0fY_axcqBSiHLkhEyD2ul6PBDBsgPrqkt1Tvz0hPa-72shQ7aLJY28WCCHEuPGFZy080LDtzuI4E1jwxmYXc";

        try {
            const token = await getToken(messaging, {
                vapidKey,
                serviceWorkerRegistration: registration
            });

            console.log("FCM Token retrieved:", token);

            if (token) {
                try {
                    await updateDoc(doc(db, 'users', uid), {
                        fcmTokens: arrayUnion(token)
                    });
                    console.log("FCM Token saved to Firestore for user:", uid);
                } catch (firestoreError) {
                    console.error("Error saving token to Firestore:", firestoreError);
                }
            }
        } catch (tokenError) {
            console.error("Error getting FCM token:", tokenError);
        }
    };

    useEffect(() => {
        if (user && Notification.permission === 'granted') {
            setupMessagingToken(user.uid);
        }

        const unsubscribeMessage = onMessage(messaging, (payload) => {
            console.log("Foreground message received:", payload);
            // Show a custom notification in foreground if needed, or rely on system
            if (Notification.permission === 'granted') {
                new Notification(payload.notification?.title || "New Message", {
                    body: payload.notification?.body,
                    icon: '/pwa-192x192.png'
                });
            }
        });

        return () => {
            unsubscribeMessage();
        };
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        try {
            await updateDoc(doc(db, 'notifications', notificationId), { read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!user || unreadCount === 0) return;

        const unreadNotifications = notifications.filter(n => !n.read);
        const batch = writeBatch(db);

        unreadNotifications.forEach(n => {
            batch.update(doc(db, 'notifications', n.id), { read: true });
        });

        try {
            await batch.commit();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, requestPermission, loading }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
