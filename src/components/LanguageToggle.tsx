import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export const LanguageToggle = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'he' : 'en';
        i18n.changeLanguage(newLang);
    };

    useEffect(() => {
        document.dir = i18n.dir();
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLanguage}
            className="fixed top-4 right-4 z-50 px-4 py-2 bg-white/80 backdrop-blur-sm border border-romantic-pink rounded-full shadow-sm text-deep-rose font-medium transition-all hover:bg-romantic-pink/10"
        >
            {i18n.language === 'en' ? 'HE' : 'EN'}
        </motion.button>
    );
};
