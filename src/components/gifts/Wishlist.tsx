import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Gift, GiftCard } from './GiftCard';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '../ui/Skeleton';
import { useModal } from '../../context/ModalContext';

interface WishlistProps {
    showFavorites?: boolean;
    top5Ids?: string[];
    searchQuery?: string;
}

export const Wishlist = ({ showFavorites, top5Ids, searchQuery = '' }: WishlistProps) => {
    const { user } = useAuth();
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [loading, setLoading] = useState(true);
    const { setEditingGift } = useModal();

    useEffect(() => {
        if (!user) return;

        const qOwner = query(collection(db, 'gifts'), where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(qOwner, (snapshot) => {
            const fetchedGifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));
            // Sort client-side: Newest first
            fetchedGifts.sort((a, b) => {
                const dateA = a.createdAt?.seconds || 0;
                const dateB = b.createdAt?.seconds || 0;
                return dateB - dateA;
            });
            setGifts(fetchedGifts);
            setLoading(false);
        }, (err) => {
            console.error("Owner query error", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const filteredGifts = gifts.filter(g => {
        const matchesFavorite = showFavorites ? g.isFavorite : true;
        const matchesSearch = searchQuery
            ? g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.note?.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
        return matchesFavorite && matchesSearch;
    });

    const top5Gifts = top5Ids ? top5Ids.map(id => gifts.find(g => g.id === id)).filter(Boolean) as Gift[] : [];
    const mainListGifts = top5Ids ? filteredGifts.filter(g => !top5Ids.includes(g.id)) : filteredGifts;

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-3">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (gifts.length === 0) {
        return (
            <div className="text-center py-12 px-6">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Sparkles size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-600 mb-2">No wishes yet</h3>
                <p className="text-slate-400 text-sm">Use the + button to add your first wish!</p>
            </div>
        );
    }

    return (
        <div className="pb-28">
            {/* Top 5 Section (Only visible if IDs passed & items found) */}
            {top5Gifts.length > 0 && !showFavorites && (
                <section className="mb-10">
                    <div className="bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 p-6 rounded-3xl border border-yellow-200/50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-400/20 transition-all duration-700" />

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 shadow-inner">
                                <Sparkles size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-yellow-900 leading-tight">Top 5 Favorites</h2>
                                <p className="text-xs text-yellow-700/80 font-medium tracking-wide uppercase">Most Wanted</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                            {top5Gifts.map((gift, index) => (
                                <div key={gift.id} className="relative">
                                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg flex items-center justify-center text-white font-bold text-sm z-20 border-2 border-white">
                                        {index + 1}
                                    </div>
                                    <GiftCard
                                        gift={gift}
                                        isOwner={user?.uid === gift.ownerId}
                                        onEdit={setEditingGift}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Main Grid */}
            {(showFavorites && mainListGifts.length === 0) ? (
                <div className="text-center py-12 px-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-600 mb-2">No favorites yet</h3>
                    <p className="text-slate-400 text-sm">Heart items to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {mainListGifts.map(gift => (
                        <GiftCard
                            key={gift.id}
                            gift={gift}
                            isOwner={user?.uid === gift.ownerId}
                            onEdit={setEditingGift}
                        />
                    ))}
                </div>
            )}

        </div>
    );
};
