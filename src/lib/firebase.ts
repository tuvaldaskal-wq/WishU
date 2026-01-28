import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';
import { GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyB5IxD6TIYVHcQ1UHtGz9PRATJTK_QpOWs",
    authDomain: "wishu-c16d5.firebaseapp.com",
    projectId: "wishu-c16d5",
    storageBucket: "wishu-c16d5.firebasestorage.app",
    messagingSenderId: "159437089644",
    appId: "1:159437089644:web:3df478217e65a7d12fa149"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1');
export const messaging = getMessaging(app);
export const googleProvider = new GoogleAuthProvider();

