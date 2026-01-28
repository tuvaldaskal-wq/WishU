import { useState, useEffect } from 'react';


import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Search, Trophy, GripVertical, Plus, X, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// --- Sortable Item Component ---
const SortableItem = ({ id, gift, index, onRemove }: any) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 mb-3 touch-none">
            <div className="text-slate-300">
                <GripVertical size={20} />
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-slate-100 text-slate-500' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                {index < 3 ? <Trophy size={14} /> : index + 1}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-darkbg truncate">{gift?.title || 'Unknown Gift'}</p>
            </div>
            <button onClick={() => onRemove(id)} className="p-2 text-slate-300 hover:text-red-400">
                <X size={18} />
            </button>
        </div>
    );
};

// --- Main Page Component ---
export const Top5Page = () => {
    // const { t } = useTranslation();
    const { user, userProfile } = useAuth() as any;

    const [allGifts, setAllGifts] = useState<any[]>([]);
    const [top5Ids, setTop5Ids] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // 1. Fetch User's Top 5
                if (userProfile?.top5) {
                    setTop5Ids(userProfile.top5);
                }

                // 2. Fetch All Gifts (Owner)
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                // Note: Using client-side sorting if index issues arise, but try standard first
                const q = query(collection(db, 'gifts'), where('ownerId', '==', user.uid));
                const snap = await getDocs(q);
                const gifts = snap.docs.map(change => ({ id: change.id, ...change.data() }));
                setAllGifts(gifts);
            } catch (err) {
                console.error("Error loading top 5 data", err);
            }
        };
        fetchData();
    }, [user, userProfile]);

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setTop5Ids((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);
                saveTop5(newOrder); // Auto-save
                return newOrder;
            });
        }
    };

    const saveTop5 = async (newIds: string[]) => {
        if (!user) return;
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                top5: newIds
            });
        } catch (err) {
            console.error("Error saving top 5", err);
        }
    };

    const addToTop5 = (giftId: string) => {
        if (top5Ids.length >= 5) {
            alert("You can only have 5 top wishes! Remove one first.");
            return;
        }
        if (top5Ids.includes(giftId)) return;

        const newIds = [...top5Ids, giftId];
        setTop5Ids(newIds);
        saveTop5(newIds);
    };

    const removeFromTop5 = (giftId: string) => {
        const newIds = top5Ids.filter(id => id !== giftId);
        setTop5Ids(newIds);
        saveTop5(newIds);
    };

    // Derived state
    const top5Gifts = top5Ids.map(id => allGifts.find(g => g.id === id)).filter(Boolean);
    const availableGifts = allGifts.filter(g => !top5Ids.includes(g.id) && g.title?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-lightbg font-sans pb-32">
            <header className="bg-darkbg text-white px-6 pt-12 pb-8 rounded-b-3xl shadow-xl mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Trophy className="text-yellow-400" size={24} />
                    <h1 className="text-2xl font-bold tracking-tight">Top 5 Wishes</h1>
                </div>
                <p className="text-slate-400 text-sm">Rank your most wanted gifts for your partner to see.</p>
            </header>

            <main className="px-6 space-y-6">
                {/* Ranking Zone */}
                <section>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex justify-between">
                        <span>Your Top 5 ({top5Ids.length}/5)</span>
                    </h2>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={top5Ids} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1">
                                {top5Gifts.map((gift, index) => (
                                    <SortableItem key={gift.id} id={gift.id} gift={gift} index={index} onRemove={removeFromTop5} />
                                ))}
                                {top5Ids.length === 0 && (
                                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                                        <Star size={32} className="mb-2 opacity-20" />
                                        <p className="text-sm">Drag or add gifts here</p>
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                </section>

                {/* Available Gifts */}
                <section>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Add from Wishlist</h2>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                            type="text"
                            placeholder="Search gifts..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-white pl-9 pr-4 py-3 rounded-xl border border-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-3">
                        {availableGifts.map(gift => (
                            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={gift.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {gift.imageUrl ? <img src={gift.imageUrl} alt={gift.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Star size={12} /></div>}
                                    </div>
                                    <p className="text-sm font-medium text-darkbg truncate">{gift.title}</p>
                                </div>
                                <button
                                    onClick={() => addToTop5(gift.id)}
                                    disabled={top5Ids.length >= 5}
                                    className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary hover:text-white transition-colors"
                                >
                                    <Plus size={16} />
                                </button>
                            </motion.div>
                        ))}
                        {availableGifts.length === 0 && searchTerm && (
                            <p className="text-center text-slate-400 text-sm py-4">No gifts found.</p>
                        )}
                    </div>
                </section>
            </main>


        </div>
    );
};
