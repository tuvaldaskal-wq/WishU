import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LanguageToggle } from '../components/LanguageToggle';
import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';

const LandingPage = () => {
    const { t } = useTranslation();
    const { signInWithGoogle, user, loading } = useAuth();
    const navigate = useNavigate();
    const [signingIn, setSigningIn] = useState(false);
    const [inAppBrowser, setInAppBrowser] = useState(false);

    // Detect in-app browsers (Instagram, TikTok, Facebook, WhatsApp, etc.)
    // These block popups AND break signInWithRedirect due to storage partitioning.
    useEffect(() => {
        const ua = navigator.userAgent || '';
        const isInApp = /Instagram|FBAN|FBAV|TikTok|Twitter|Line\/|WhatsApp|MicroMessenger/.test(ua);
        setInAppBrowser(isInApp);
    }, []);

    // Belt-and-suspenders: navigate as soon as auth state resolves to a signed-in user.
    // Covers the redirect flow where the popup never returned a promise resolution.
    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    const handleStart = async () => {
        if (user) {
            navigate('/dashboard', { replace: true });
            return;
        }
        try {
            setSigningIn(true);
            await signInWithGoogle();
            // Popup resolved successfully — navigate explicitly instead of waiting
            // for a re-render cycle (avoids the race condition on mobile browsers).
            if (auth.currentUser) {
                navigate('/dashboard', { replace: true });
            }
            // If signInWithRedirect was used (popup blocked), the page reloads and
            // the useEffect above handles navigation once auth state is restored.
        } catch (error) {
            console.error("Login failed", error);
        } finally {
            setSigningIn(false);
        }
    };

    return (
        <div className="min-h-screen bg-darkbg flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
            <LanguageToggle />

            {/* Background decoration */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 max-w-lg"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 relative"
                >
                    <ShoppingBag className="w-16 h-16 text-primary" strokeWidth={2} />
                    <span className="absolute inset-0 flex items-center justify-center text-secondary font-bold text-2xl pt-2">U</span>
                </motion.div>

                <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                    Wish<span className="text-primary">U</span>
                </h1>

                <p className="text-xl text-slate-300 mb-12 font-light leading-relaxed">
                    {t('welcome', "Make your partner's wishes come true.")}
                </p>

                {inAppBrowser ? (
                    /* In-app browser warning — Google sign-in won't work here */
                    <div className="bg-white/10 border border-white/20 rounded-2xl p-5 text-white space-y-3">
                        <p className="font-semibold">{t('inapp_browser_title', 'Open in your browser')}</p>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {t('inapp_browser_desc', "Google sign-in doesn't work inside Instagram, TikTok or WhatsApp. Tap the menu (⋯ or ⋮) and choose \"Open in Chrome\" or \"Open in Safari\".")}
                        </p>
                        <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm pt-1">
                            <ExternalLink size={16} />
                            <span>wishu-c16d5.web.app</span>
                        </div>
                    </div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStart}
                        disabled={signingIn || loading}
                        className="group relative px-8 py-4 bg-white text-darkbg rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all flex items-center gap-3 mx-auto disabled:opacity-70 disabled:cursor-wait"
                    >
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span>
                            {signingIn
                                ? t('signing_in', 'Signing in...')
                                : t('get_started', 'Get Started')}
                        </span>
                    </motion.button>
                )}
            </motion.div>

            {/* Dev Helper for Testing */}
            {import.meta.env.DEV && (
                <button
                    onClick={async () => {
                        const { signInAnonymously } = await import('firebase/auth');
                        const { auth } = await import('../lib/firebase');
                        await signInAnonymously(auth);
                        navigate('/onboarding');
                    }}
                    className="absolute top-4 left-4 text-xs text-slate-500 opacity-50 hover:opacity-100 z-50"
                >
                    [Dev: Guest Login]
                </button>
            )}
        </div>
    );
};

export default LandingPage;
