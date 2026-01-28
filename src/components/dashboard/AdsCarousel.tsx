import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ADS = [
    {
        id: 1,
        title: "Fresh Flowers",
        subtitle: "Order now for 20% off",
        bg: "bg-gradient-to-r from-secondary to-pink-400"
    },
    {
        id: 2,
        title: "Tech Gadgets",
        subtitle: "Latest deals on electronics",
        bg: "bg-gradient-to-r from-primary to-primary-light"
    },
    {
        id: 3,
        title: "Experience Days",
        subtitle: "Gift memories, not things",
        bg: "bg-gradient-to-r from-accent to-yellow-400",
        textColor: "text-primary"
    }
];

export const AdsCarousel = ({ fullWidth = false }: { fullWidth?: boolean }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % ADS.length);
        }, 5000); // 5 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={`w-full h-32 md:h-40 relative overflow-hidden shadow-lg group ${fullWidth ? 'rounded-none mb-0' : 'rounded-2xl mb-6'}`}>
            <AnimatePresence mode='wait'>
                <motion.div
                    key={ADS[index].id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 ${ADS[index].bg} flex items-center justify-center ${ADS[index].textColor || 'text-white'} p-6`}
                >
                    <div className="absolute inset-0 bg-black/5" />
                    <div className="relative z-10 text-center">
                        <p className="font-bold text-xl mb-1">{ADS[index].title}</p>
                        <p className="text-sm opacity-90">{ADS[index].subtitle}</p>
                        <button className="mt-3 bg-primary text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-md hover:scale-105 transition-transform">
                            Shop Now
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-20">
                {ADS.map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === index ? 'bg-primary w-4' : 'bg-primary/30'}`}
                    />
                ))}
            </div>
        </div>
    );
};
