import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { wrapAffiliateLink } from '../lib/utils';

const GiftDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: _user } = useAuth();
    const [gift, setGift] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGift = async () => {
            if (!id) return;
            try {
                const docSnap = await getDoc(doc(db, 'gifts', id));
                if (docSnap.exists()) {
                    setGift({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (err) {
                console.error("Error fetching gift details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchGift();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!gift) {
        return (
            <div className="text-center py-20 px-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Gift Not Found</h2>
                <button onClick={() => navigate(-1)} className="text-primary font-bold">Go Back</button>
            </div>
        );
    }



    return (
        <div className="bg-white min-h-screen font-sans pb-40 overflow-x-hidden relative">
            {/* Massive Artistic Pink Circle Backdrop (Absolute Precision) */}
            <div
                className="absolute bg-[#E79BE3] rounded-full z-0 opacity-95 shadow-inner"
                style={{
                    top: '-10%',
                    right: '-20%',
                    width: '90vw',
                    height: '90vw',
                    maxWidth: '500px',
                    maxHeight: '500px'
                }}
            />

            {/* Back Button */}
            <div className="px-6 pt-4 relative z-20">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white/70 backdrop-blur-xl rounded-full flex items-center justify-center text-slate-600 hover:text-primary transition-all shadow-md border border-white/30"
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            <main className="px-6 flex flex-col items-center relative z-10">
                {/* Hero Section */}
                <div className="relative w-full flex justify-center items-center py-6 mt-12">
                    {/* Floating Product Image - Restored Pure Aesthetic (No Shadows/Borders) */}
                    <div className="relative w-72 h-72 flex items-center justify-center translate-x-4">
                        {gift.imageUrl ? (
                            <img
                                src={gift.imageUrl}
                                alt={gift.title}
                                className="w-full h-full object-contain relative z-10"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#E79BE3]/40">
                                <Heart size={140} strokeWidth={0.5} />
                            </div>
                        )}

                        {/* Shopping Cart Badge (Accent Lime #DFE137) - Functional Link */}
                        <a
                            href={wrapAffiliateLink(gift.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-4 right-4 w-12 h-12 bg-[#DFE137] rounded-full flex items-center justify-center text-black shadow-xl hover:scale-110 active:scale-90 transition-transform z-20"
                        >
                            <ShoppingCart size={20} strokeWidth={2.5} />
                        </a>
                    </div>
                </div>

                {/* Product Info */}
                <div className="w-full mt-2 space-y-6">
                    <div className="text-center">
                        {/* Title & Price in Deep Navy #0C0C4F */}
                        <h1 className="text-3xl font-black text-[#0C0C4F] mb-1 leading-tight">{gift.title}</h1>
                        <p className="text-2xl font-black text-[#0C0C4F]">
                            {gift.price || 'Priceless'}
                        </p>
                    </div>

                    <div className="pt-2">
                        {/* Description - Light Weight, Airy */}
                        <p className="text-slate-500 leading-relaxed font-light text-base text-center max-w-sm mx-auto">
                            {gift.note || "This beautiful item is waiting to be yours. A perfect addition to any collection, crafted with care and designed to bring joy and elegance to your daily life."}
                        </p>
                    </div>

                    {/* Meta Info */}
                    <div className="pt-8 mb-10 flex flex-col items-center gap-2 opacity-10">
                        <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase font-bold">CODE: {gift.id.slice(0, 8)}</div>
                    </div>
                </div>
            </main>

            {/* Primary Action FAB (Deep Navy #0C0C4F) - Fixed exactly above BottomNav */}
            <div className="fixed bottom-[105px] left-6 right-6 flex justify-center z-50 pointer-events-none">
                <a
                    href={wrapAffiliateLink(gift.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto bg-[#0C0C4F] text-white px-10 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                    View in Store
                    <ExternalLink size={16} />
                </a>
            </div>
        </div>
    );
};

export default GiftDetailPage;
