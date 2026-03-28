import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface UserProfile {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    description?: string;
    birthDate?: string;
    privacySettings?: any;
    top5?: string[];
    importantDates?: { title: string; date: string; type: string }[];
    notificationPreferences?: {
        [group: string]: {
            enabled: boolean;
            first: string;
            second: string;
        }
    };
    // Add other user-specific fields here
    isAdmin?: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    userProfile: UserProfile | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signInWithGoogle: async () => { },
    logout: async () => { },
    userProfile: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const signInWithGoogle = async () => {
        try {
            // Robust mobile detection (including iPadOS 13+ which pretends to be Mac)
            const ua = navigator.userAgent;
            const isTouch = navigator.maxTouchPoints > 0;
            const isMobileUA = /iPhone|iPad|iPod|Android/i.test(ua);
            const isIpadOS = (navigator.platform === 'MacIntel' && isTouch);
            const isMobile = isMobileUA || isIpadOS;

            if (isMobile) {
                // Use Redirect for mobile to avoid popup blockers and webview limits
                await signInWithRedirect(auth, googleProvider);
            } else {
                await signInWithPopup(auth, googleProvider);
            }
        } catch (error: any) {
            console.error("Google verify failed", error);
            // If popup is blocked on desktop, fallback to redirect might be a good idea,
            // but for now we just handle the mobile requirement.
            if (error?.code === 'auth/popup-blocked') {
                await signInWithRedirect(auth, googleProvider);
            } else {
                throw error;
            }
        }
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
    };

    useEffect(() => {
        // Handle redirect result (for mobile flows)
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    console.log("Redirect login successful:", result.user.uid);
                    // The onAuthStateChanged listener will handle state updates,
                    // but we can log here for debugging.
                }
            })
            .catch((error) => {
                console.error("Auth redirect error:", error);
                if (error.code === 'auth/account-exists-with-different-credential') {
                    // Handle linking if needed, or show specific error
                }
            });

        let profileUnsubscribe: (() => void) | null = null;

        const authUnsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("AuthContext: State changed", currentUser?.uid);
            setUser(currentUser);

            // Clean up previous profile listener
            if (profileUnsubscribe) {
                profileUnsubscribe();
                profileUnsubscribe = null;
            }

            if (currentUser) {
                // Real-time listener for user profile
                profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as UserProfile);
                    } else {
                        // Create basic profile if it doesn't exist
                        const newProfile = {
                            displayName: currentUser.displayName,
                            email: currentUser.email,
                            photoURL: currentUser.photoURL,
                            createdAt: new Date().toISOString()
                        };
                        setDoc(doc(db, 'users', currentUser.uid), newProfile, { merge: true });
                        setUserProfile(newProfile);
                    }
                }, (err) => {
                    console.error("AuthContext: Profile sync error", err);
                });
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        // Cleanup function
        return () => {
            authUnsubscribe();
            if (profileUnsubscribe) profileUnsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, userProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => useContext(AuthContext);
