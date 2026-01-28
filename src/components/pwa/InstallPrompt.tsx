import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Heart, MoreVertical } from 'lucide-react';

const InstallPrompt = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showManualInstruction, setShowManualInstruction] = useState(false);

    useEffect(() => {
        // 1. Check if already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;

        // 2. Check dismissal frequency (7 days)
        const dismissedAt = localStorage.getItem('installPromptDismissedAt');
        if (dismissedAt) {
            const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissal < 7) return;
        }

        // 3. Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        if (isIosDevice) {
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }

        // 4. Android / Desktop
        // A. Listen for Native Event
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };
        window.addEventListener('beforeinstallprompt', handler);

        // B. Fallback Timer (Force show if event doesn't fire)
        const fallbackTimer = setTimeout(() => {
            // Only show if not already visible (meaning event didn't fire)
            // and we are sure we are not installed (checked above)
            setIsVisible(prev => {
                if (!prev) return true;
                return prev;
            });
        }, 5000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(fallbackTimer);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Native Prompt Available
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User choice: ${outcome}`);
            setDeferredPrompt(null);
            setIsVisible(false);
        } else {
            // Fallback: Show Manual Instructions
            setShowManualInstruction(true);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('installPromptDismissedAt', Date.now().toString());
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-none flex justify-center pb-6 px-4">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="pointer-events-auto w-full max-w-sm bg-white/90 backdrop-blur-md border border-pink-100 rounded-3xl shadow-2xl p-5 relative overflow-hidden"
                >
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                        aria-label={t('close')}
                    >
                        <X size={18} />
                    </button>

                    <div className="flex flex-col gap-4 relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <Heart size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="font-bold text-darkbg text-lg leading-tight">{t('install_title')}</h3>
                                <p className="text-xs text-slate-500">{isIOS ? t('install_desc_ios') : t('install_desc_android')}</p>
                            </div>
                        </div>

                        {/* Action Area */}
                        {isIOS ? (
                            <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 border border-slate-100">
                                <Share size={20} className="text-blue-500 animate-bounce" />
                                <p className="text-sm text-slate-600 font-medium">{t('install_ios_instruction')}</p>
                            </div>
                        ) : (
                            <>
                                {showManualInstruction ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-amber-50 rounded-xl p-3 flex items-center gap-3 border border-amber-100"
                                    >
                                        <MoreVertical size={20} className="text-amber-600 animate-bounce" />
                                        <p className="text-sm text-slate-700 font-medium">
                                            {t('install_android_manual')}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <button
                                        onClick={handleInstallClick}
                                        className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all text-sm"
                                    >
                                        {t('install_button')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InstallPrompt;
