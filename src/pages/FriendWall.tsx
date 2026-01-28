import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GiftCard, Gift } from '../components/gifts/GiftCard';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { getNextEventDate } from '../lib/utils';
import { Timer, Send } from 'lucide-react';
import { useModal } from '../context/ModalContext';
import { useHeader } from '../context/HeaderContext';
import { SendGreetingModal } from '../components/notifications/SendGreetingModal';

const FriendWall = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { setHeaderState, resetHeader } = useHeader();
    const [gifts, setGifts] = useState<Gift[]>([]);
    const [friendName, setFriendName] = useState('Friend');
    const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'mid' | 'high' | 'premium'>('all');
    const [loading, setLoading] = useState(true);

    // Countdown State
    const [nextEvent, setNextEvent] = useState<{ title: string; date: Date } | null>(null);
    const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null);
    const { setEditingGift } = useModal();
    const isOwner = user?.uid === id;

    // Countdown Timer Effect
    useEffect(() => {
        if (!nextEvent) return;

        const tick = () => {
            const now = new Date();
            const diff = nextEvent.date.getTime() - now.getTime();

            if (diff <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            setCountdown({ days, hours, minutes });
        };

        tick();
        const interval = setInterval(tick, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [nextEvent]);

    // Cleanup Header on Unmount
    useEffect(() => {
        return () => resetHeader();
    }, []);

    // Update Header when state changes
    useEffect(() => {
        setHeaderState({
            title: isOwner ? 'My Wishlist' : `${friendName}'s Wishlist`,
            showBackButton: true,
            showSearch: false,
            customBottomBar: (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                        onClick={() => navigate('/calendar')}
                        className="px-3 py-1.5 bg-accent text-white rounded-full text-xs font-bold whitespace-nowrap shadow-sm shadow-accent/20 flex items-center gap-1 flex-shrink-0"
                    >
                        Offer Wish 🎁
                    </button>
                    <div className="w-[1px] h-6 bg-slate-100 mx-1 flex-shrink-0" />
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'low', label: '<249₪' },
                        { id: 'mid', label: '250-399₪' },
                        { id: 'high', label: '400-699₪' },
                        { id: 'premium', label: '700₪+' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setPriceFilter(f.id as any)}
                            className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 border ${priceFilter === f.id
                                ? 'bg-darkbg text-white border-darkbg'
                                : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )
        });
    }, [friendName, isOwner, priceFilter]);

    useEffect(() => {
        if (!id || !user) return;

        let assignedGroup = 'Friends'; // Default fallback

        // 1. Fetch Friendship to get MY assigned group
        const fetchPermissions = async () => {
            const q = query(collection(db, 'friendships'), where('users', 'array-contains', user.uid));
            const snap = await getDocs(q);
            const friendship = snap.docs.find(d => d.data().users.includes(id));

            if (friendship) {
                const groups = friendship.data().groups || {};
                if (groups[user.uid]) {
                    assignedGroup = groups[user.uid];
                }
            }
        };

        // 2. Fetch Friend Profile & Next Event
        const fetchProfile = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', id));
                if (userDoc.exists()) {
                    const d = userDoc.data();
                    setFriendName(d.displayName || 'Friend');

                    // Calculate Nearest Event
                    let nearest: { title: string; date: Date; diff: number } | null = null;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const checkDate = (dateStr: string, title: string) => {
                        const next = getNextEventDate(dateStr);
                        if (next) {
                            const diff = next.date.getTime() - today.getTime();
                            if (diff >= 0 && (!nearest || diff < nearest.diff)) {
                                nearest = { title, date: next.date, diff };
                            }
                        }
                    };

                    if (d.birthDate) checkDate(d.birthDate, 'Birthday');
                    if (d.importantDates && Array.isArray(d.importantDates)) {
                        d.importantDates.forEach((imp: any) => checkDate(imp.date, imp.title || 'Special Day'));
                    }

                    if (nearest) {
                        setNextEvent({ title: (nearest as any).title, date: (nearest as any).date });
                    }
                }
            } catch (e) { console.error(e); }
        };

        // 3. Fetch Gifts & Apply Filter
        const fetchGifts = async () => {
            await fetchPermissions(); // Ensure we know our group first

            const q = query(collection(db, 'gifts'), where('ownerId', '==', id));

            // Real-time listener
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const allGifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gift));

                // Filter Logic
                const visibleGifts = allGifts.filter(g => {
                    if (!g.visibility || g.visibility.length === 0) return true;
                    return g.visibility.includes(assignedGroup);
                });

                visibleGifts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setGifts(visibleGifts);
                setLoading(false);
            });
            return unsubscribe; // Return cleanup
        };

        fetchProfile();
        const unsubPromise = fetchGifts();

        return () => { unsubPromise.then(unsub => unsub && unsub()); };
    }, [id, user]);

    // Price Parsing Helper
    const parsePrice = (priceStr?: string) => {
        if (!priceStr) return 0;
        return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
    };

    const filteredGifts = gifts.filter(gift => {
        const price = parsePrice(gift.price);
        switch (priceFilter) {
            case 'low': return price < 249;
            case 'mid': return price >= 250 && price <= 399;
            case 'high': return price >= 400 && price <= 699;
            case 'premium': return price >= 700;
            default: return true;
        }
    });

    const [showGreetingModal, setShowGreetingModal] = useState(false);

    const isToday = nextEvent && new Date().toDateString() === nextEvent.date.toDateString();

    return (
        <div className="min-h-screen bg-lightbg font-sans pb-10">
            <main className="px-6 py-6 space-y-6">
                {/* Countdown Hero Banner */}
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10">
                        {nextEvent && countdown ? (
                            isToday ? (
                                <div className="text-center animate-pulse">
                                    <div className="flex items-center justify-center gap-2 mb-2 text-teal-100 uppercase tracking-widest text-xs font-bold">
                                        <Timer size={14} />
                                        Happening Now!
                                    </div>
                                    <h2 className="text-3xl font-black mb-2">
                                        Today is {friendName}'s {nextEvent.title}! 🥳
                                    </h2>
                                    <div className="text-lg opacity-90 mb-4">
                                        Don't forget to send your wishes!
                                    </div>
                                    <button
                                        onClick={() => setShowGreetingModal(true)}
                                        className="inline-flex items-center gap-2 bg-white text-teal-600 px-6 py-3 rounded-full font-bold text-base shadow-lg hover:bg-teal-50 transition-all hover:scale-105"
                                    >
                                        <Send size={18} />
                                        Send Greeting
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2 text-teal-100 uppercase tracking-widest text-xs font-bold">
                                        <Timer size={14} />
                                        Upcoming Event
                                    </div>
                                    <h2 className="text-2xl font-bold mb-1">
                                        {nextEvent.title}
                                    </h2>
                                    <div className="text-4xl font-black mb-4 tracking-tight tabular-nums">
                                        {countdown.days}d {countdown.hours}h {countdown.minutes}m
                                    </div>

                                    <button
                                        onClick={() => setShowGreetingModal(true)}
                                        className="inline-flex items-center gap-2 bg-white text-teal-600 px-5 py-2.5 rounded-full font-bold text-sm shadow-sm hover:bg-teal-50 transition-colors"
                                    >
                                        <Send size={16} />
                                        Send Greeting
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="text-center py-4">
                                <p className="font-medium text-lg opacity-90">No upcoming events on the horizon</p>
                                <p className="text-sm text-teal-100">Make every day special anyway!</p>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-10 text-slate-400">Loading...</div>
                ) : filteredGifts.length === 0 ? (
                    <div className="text-center mt-10 p-6 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500 font-medium">No gifts found</p>
                        <p className="text-xs text-slate-400">Try a different filter or check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-12">
                        {filteredGifts.map(gift => (
                            <GiftCard
                                key={gift.id}
                                gift={gift}
                                isOwner={isOwner}
                                onEdit={setEditingGift}
                            />
                        ))}
                    </div>
                )}
            </main>

            <SendGreetingModal
                isOpen={showGreetingModal}
                onClose={() => setShowGreetingModal(false)}
                recipient={{
                    uid: id || '',
                    name: friendName,
                }}
                eventType={nextEvent?.title.toLowerCase().includes('birthday') ? 'birthday' : 'other'}
            />
        </div >
    );
};

export default FriendWall;
