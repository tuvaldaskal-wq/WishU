import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Check, Gift as GiftIcon, Trash2, Heart, Lock, ShoppingCart } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { wrapAffiliateLink } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';

export interface Gift {
    id: string;
    ownerId: string;
    coupleId?: string; // Optional now
    title: string;
    price?: string;
    link: string;
    imageUrl?: string;
    status: 'available' | 'purchased';
    isFavorite?: boolean;
    createdAt?: any;
    visibility?: string[]; // Array of allowed groups
    purchasedBy?: string; // UDPATED: Track who bought it
    note?: string; // Metadata/Notes for searching
}

interface GiftCardProps {
    gift: Gift;
    isOwner: boolean;
    onEdit?: (gift: Gift) => void;
}

export const GiftCard = ({ gift, isOwner, onEdit }: GiftCardProps) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    const toggleStatus = async () => {
        if (isOwner) return; // Owner can't purchase their own gift via this button
        if (!user) return;

        const isCurrentlyPurchased = gift.status === 'purchased';

        // RESTRICTION: If trying to UN-purchase, check ownership
        if (isCurrentlyPurchased) {
            if (gift.purchasedBy && gift.purchasedBy !== user.uid) {
                alert("This gift was marked as purchased by someone else.");
                return;
            }
        }

        const newStatus = isCurrentlyPurchased ? 'available' : 'purchased';

        if (newStatus === 'purchased') {
            // Trigger celebration!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#0F766E', '#F97316', '#FFFFFF'] // Teal, Orange, White
            });
        }

        try {
            await updateDoc(doc(db, 'gifts', gift.id), {
                status: newStatus,
                // If purchasing, set ID. If unpurchasing, clear it (or set null/delete field)
                purchasedBy: newStatus === 'purchased' ? user.uid : null
            });
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Allow owner to toggle "Favorite" (priority)
        if (!isOwner) return;
        try {
            await updateDoc(doc(db, 'gifts', gift.id), {
                isFavorite: !gift.isFavorite
            });
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(t('delete_confirm') || 'Delete this gift?')) {
            try {
                await deleteDoc(doc(db, 'gifts', gift.id));
            } catch (err) {
                console.error("Failed to delete gift", err);
            }
        }
    };

    const isPurchased = gift.status === 'purchased';
    const showPurchasedToUser = !isOwner && isPurchased;
    const isLocked = isPurchased && !!gift.purchasedBy && gift.purchasedBy !== user?.uid;

    const handleClick = () => {
        if (isOwner && onEdit) {
            onEdit(gift);
        } else {
            navigate(`/gift/${gift.id}`);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={handleClick}
            className={`
                flex flex-col items-center transition-all duration-300 group relative cursor-pointer
            `}
        >
            {/* Product Image Container (Floating) */}
            <div className="relative w-full aspect-[4/5] mb-4">
                {/* Discount Tag (Accent Lime #DFE137) - Disabled for now as per user request */}
                {/* <div className="absolute top-0 right-0 bg-[#DFE137] text-primary font-bold text-[10px] px-2 py-1 z-20">
                    10% OFF
                </div> */}

                <div className={`w-full h-full rounded-2xl overflow-hidden ${showPurchasedToUser ? 'grayscale-[0.5]' : ''}`}>
                    {gift.imageUrl ? (
                        <img
                            src={gift.imageUrl}
                            alt={gift.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                            <GiftIcon size={40} strokeWidth={1.5} />
                        </div>
                    )}
                </div>

                {/* Actions Overlay (Buttons) */}
                <div className="absolute inset-0 flex items-start justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {/* Favorite Button */}
                    {(isOwner || gift.isFavorite) && (
                        <button
                            onClick={toggleFavorite}
                            className={`w-8 h-8 bg-white rounded-full flex items-center justify-center transition-all shadow-sm ${gift.isFavorite ? 'text-secondary' : 'text-slate-300 hover:text-secondary'}`}
                            disabled={!isOwner}
                        >
                            <Heart size={16} fill={gift.isFavorite ? "currentColor" : "none"} />
                        </button>
                    )}

                    <div className="flex gap-2">
                        {/* Link Button */}
                        <a
                            href={wrapAffiliateLink(gift.link)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm"
                        >
                            <ExternalLink size={14} />
                        </a>

                        {/* Delete Button (Owner Only) */}
                        {isOwner && (
                            <button
                                onClick={handleDelete}
                                className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-danger hover:bg-red-50 transition-all shadow-sm"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Cart/Purchase Button Overly for Friends (Floating) */}
                {!isOwner && (
                    <button
                        onClick={toggleStatus}
                        disabled={isLocked}
                        className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all z-20 ${isLocked
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : showPurchasedToUser
                                ? 'bg-success text-white'
                                : 'bg-primary text-white hover:scale-105'
                            }`}
                    >
                        {isLocked ? <Lock size={16} /> : (showPurchasedToUser ? <Check size={18} /> : <ShoppingCart size={18} />)}
                    </button>
                )}
            </div>

            {/* Centered Metadata */}
            <div className="flex flex-col items-center gap-1 w-full px-2">
                {/* Product Code (Small Light Gray) */}
                <div className="text-[10px] text-slate-400 font-sans uppercase tracking-tight">
                    CODE: {gift.id.slice(0, 5)}
                </div>

                {/* Title */}
                <h3 className={`font-bold text-primary text-sm text-center line-clamp-2 min-h-[2.5rem] ${showPurchasedToUser ? 'line-through text-slate-300' : ''}`}>
                    {gift.title}
                </h3>

                {/* Price Pill (Deep Navy #0C0C4F) */}
                <div className="bg-[#0C0C4F] text-white px-5 py-1 rounded-full text-xs font-bold mt-1 shadow-sm">
                    {gift.price || 'Gift'}
                </div>
            </div>
        </motion.div>
    );
};
