import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
// import { collection, query, where, getDocs } from 'firebase/firestore';

interface CoupleData {
    partner1Name: string;
    invitationMessage: string;
}

const InvitationPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, signInWithGoogle, loading: authLoading } = useAuth();
    const [coupleData, setCoupleData] = useState<CoupleData | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Wait for global auth to settle
        if (authLoading) return;

        const initAndFetch = async () => {
            // If no user, sign in anonymously to read the doc (assuming security rules require auth)
            if (!user) {
                try {
                    const { signInAnonymously } = await import('firebase/auth');
                    const { auth } = await import('../lib/firebase');
                    await signInAnonymously(auth);
                    // The auth state change will trigger this effect again with a user
                    return;
                } catch (e) {
                    console.error("Auto-auth failed on invite page", e);
                    setError('Authentication failed');
                    setPageLoading(false);
                    return;
                }
            }

            if (!id) return;

            try {
                const docRef = doc(db, 'couples', id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setCoupleData(docSnap.data() as CoupleData);
                } else {
                    setError('Invitation not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load invitation. Please refresh.');
            } finally {
                setPageLoading(false);
            }
        };

        initAndFetch();
    }, [id, user, authLoading]);

    const handleJoin = async () => {
        if (!id) return;

        let currentUser = user;
        // If no user OR user is anonymous (guest), force Google Login
        if (!currentUser || currentUser.isAnonymous) {
            try {
                await signInWithGoogle();
                // We need to wait a moment for the context/auth to update, or grab it directly
                const { auth } = await import('../lib/firebase');
                currentUser = auth.currentUser;
                if (!currentUser || currentUser.isAnonymous) return; // Login failed or cancelled
            } catch (err) {
                console.error("Login failed", err);
                return;
            }
        }

        setPageLoading(true);
        try {
            // Check if user already has a profile/coupleId
            // We can fetch it directly to be sure
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.coupleId) {
                    if (userData.coupleId === id) {
                        // Already connected to this couple
                        navigate('/dashboard');
                        return;
                    } else {
                        alert("You are already connected to another partner account. You cannot join a new one without disconnecting first.");
                        setPageLoading(false);
                        return;
                    }
                }
            }

            // Link the user
            await updateDoc(userRef, {
                role: 'partner',
                coupleId: id,
                updatedAt: new Date()
            }).catch(async () => {
                // If user doc doesn't exist (new user via Google), create it
                const { setDoc, serverTimestamp } = await import('firebase/firestore');
                await setDoc(userRef, {
                    uid: currentUser.uid,
                    displayName: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                    role: 'partner', // Partner B role
                    coupleId: id,
                    createdAt: serverTimestamp()
                }, { merge: true });
            });

            // Update Couple
            const coupleRef = doc(db, 'couples', id);
            await updateDoc(coupleRef, {
                partner2Id: currentUser.uid,
                partner2Name: currentUser.displayName,
                status: 'connected'
            });

            // Refresh user profile in context if possible, or just navigate
            // checkUserProfile(currentUser.uid); // This comes from context, but we might not have access to the latest function instance if we just logged in. 
            // Navigation trigger dashboard load which checks profile.

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to join. Please try again.');
            setPageLoading(false);
        }
    };

    if (pageLoading && !coupleData && !error) return <div className="min-h-screen flex items-center justify-center bg-darkbg text-primary">Loading invitation...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-darkbg text-white">{error}</div>;

    return (
        <div className="min-h-screen bg-darkbg flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
            >
                <div className="w-20 h-20 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                    <Heart className="w-10 h-10 text-white" fill="currentColor" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">
                    Join {coupleData?.partner1Name || 'Partner'}'s List
                </h1>

                <p className="text-slate-400 mb-8">
                    Connect to see their wishlist and mark gifts as purchased.
                </p>

                {coupleData?.invitationMessage && (
                    <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left relative">
                        <div className="absolute top-0 left-6 -translate-y-1/2 bg-darkbg px-2 text-primary text-xs font-bold tracking-wider uppercase">
                            Message
                        </div>
                        <p className="text-slate-300 italic leading-relaxed">
                            "{coupleData.invitationMessage}"
                        </p>
                    </div>
                )}

                <button
                    onClick={handleJoin}
                    className="w-full py-4 bg-white text-darkbg rounded-xl font-bold text-lg shadow-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    {/* Google Icon SVG */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {(user && !user.isAnonymous) ? 'Accept & Connect' : 'Sign in to Connect'}
                </button>
            </motion.div>
        </div>
    );
};

export default InvitationPage;
