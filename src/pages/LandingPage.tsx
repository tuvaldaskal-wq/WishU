import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LanguageToggle } from '../components/LanguageToggle';

const LandingPage = () => {
    const { t } = useTranslation();
    const { signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();

    const handleStart = async () => {
        try {
            if (user) {
                navigate('/dashboard');
                return;
            }
            await signInWithGoogle();
        } catch (error) {
            console.error("Login failed", error);
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

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStart}
                    className="group relative px-8 py-4 bg-white text-darkbg rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all flex items-center gap-3 mx-auto"
                >
                    <Sparkles className="w-5 h-5 text-primary" />
                    <span>{t('get_started', "Get Started")}</span>
                </motion.button>
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
