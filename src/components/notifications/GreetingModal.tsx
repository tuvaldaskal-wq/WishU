import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Gift, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface GreetingModalProps {
    greetingId: string | null;
    onClose: () => void;
}

export const GreetingModal = ({ greetingId, onClose }: GreetingModalProps) => {
    const [greeting, setGreeting] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchGreeting = async () => {
            if (!greetingId) return;
            setLoading(true);
            try {
                const snap = await getDoc(doc(db, 'greetings', greetingId));
                if (snap.exists()) {
                    setGreeting(snap.data());
                }
            } catch (err) {
                console.error("Error fetching greeting:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGreeting();
    }, [greetingId]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!greetingId) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-darkbg/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden"
                onClick={handleBackdropClick}
            >
                {/* Signature Pink Circle Backdrop */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square bg-secondary rounded-full -z-10"
                    style={{ filter: 'blur(40px)' }}
                />

                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-all z-20"
                    >
                        <X size={20} />
                    </button>

                    {loading ? (
                        <div className="p-20 flex flex-col items-center justify-center gap-4">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-slate-400 font-medium">Opening your wish...</p>
                        </div>
                    ) : greeting ? (
                        <div className="flex flex-col">
                            {/* Card Header Section */}
                            <div className={`p-10 text-center text-white relative overflow-hidden
                                ${greeting.theme === 'party' ? 'bg-gradient-to-br from-indigo-500 to-cyan-400' :
                                    greeting.theme === 'heart' ? 'bg-gradient-to-br from-rose-500 to-red-400' :
                                        greeting.theme === 'funny' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                                            'bg-primary'}
                            `}>
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                        {greeting.theme === 'party' ? <PartyPopper size={32} /> : <Gift size={32} />}
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tight mb-2 uppercase">
                                        Message From
                                    </h2>
                                    <p className="text-5xl font-black drop-shadow-lg">
                                        {greeting.senderName}
                                    </p>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            </div>

                            {/* Content Section */}
                            <div className="p-10 text-center space-y-8">
                                {greeting.videoUrl && (
                                    <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-black border-4 border-slate-50 aspect-video group">
                                        <video
                                            src={greeting.videoUrl}
                                            controls
                                            className="w-full h-full object-cover"
                                            poster={`https://ui-avatars.com/api/?name=${greeting.senderName}&background=E79BE3&color=fff&size=512`}
                                        />
                                    </div>
                                )}

                                <div className="relative">
                                    <span className="text-primary/10 text-9xl font-black absolute -top-12 left-1/2 -translate-x-1/2 select-none">
                                        “
                                    </span>
                                    <p className="text-2xl font-bold text-darkbg leading-relaxed font-handwriting relative z-10 px-4">
                                        {greeting.message}
                                    </p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-darkbg text-white rounded-2xl font-black text-lg tracking-wide uppercase hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-darkbg/20"
                                >
                                    Close Wish
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-500">
                            Greeting not found or has been deleted.
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
