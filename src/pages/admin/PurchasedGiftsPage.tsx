import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BottomNav } from '../../components/BottomNav';
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PurchasedGiftItem {
    id: string;
    title: string;
    price?: string;
    ownerId: string;
    ownerName?: string;
    purchasedBy?: string;
    purchasedByName?: string;
    imageUrl?: string;
}

const PurchasedGiftsPage = () => {
    const navigate = useNavigate();
    const [gifts, setGifts] = useState<PurchasedGiftItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch all purchased gifts
                const q = query(collection(db, 'gifts'), where('status', '==', 'purchased'));
                const querySnapshot = await getDocs(q);

                const fetchedGifts: PurchasedGiftItem[] = [];
                const userIdsToFetch = new Set<string>();

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    fetchedGifts.push({
                        id: doc.id,
                        title: data.title,
                        price: data.price,
                        ownerId: data.ownerId,
                        purchasedBy: data.purchasedBy,
                        imageUrl: data.imageUrl
                    });

                    if (data.ownerId) userIdsToFetch.add(data.ownerId);
                    if (data.purchasedBy) userIdsToFetch.add(data.purchasedBy);
                });

                // 2. Resolve User Names
                const userMap = new Map<string, string>(); // uid -> displayName
                const userIds = Array.from(userIdsToFetch);

                // Firestore 'in' query has a limit of 10-30 depending on implementation
                // We'll chunk it just in case, though for small scale it's fine.
                // For simplicity here, assuming < 30 unique users involves in purchased gifts for now.
                // If larger, we would loop.
                if (userIds.length > 0) {
                    const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', userIds.slice(0, 30)));
                    const usersSnap = await getDocs(usersQuery);
                    usersSnap.forEach(doc => {
                        const userData = doc.data();
                        userMap.set(doc.id, userData.displayName || userData.email || 'Unknown User');
                    });

                    // If more than 30, we'd need multiple queries. For MVP assuming <30 active participants.
                }

                // 3. Map names back to gifts
                const enrichedGifts = fetchedGifts.map(gift => ({
                    ...gift,
                    ownerName: userMap.get(gift.ownerId) || 'Unknown Recipient',
                    purchasedByName: gift.purchasedBy ? (userMap.get(gift.purchasedBy) || 'Unknown Buyer') : 'Unknown Buyer'
                }));

                setGifts(enrichedGifts);

            } catch (error) {
                console.error("Error fetching purchased gifts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin')}
                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                >
                    <ArrowLeft size={20} className="text-deepNavy" />
                </button>
                <div className="flex items-center gap-2">
                    <ShoppingBag className="text-primaryPink" size={24} />
                    <h1 className="text-xl font-bold text-deepNavy">Purchased Gifts</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gift</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cost</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Buyer</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recipient</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {gifts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                                                No gifts have been purchased yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        gifts.map((gift) => (
                                            <tr key={gift.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {gift.imageUrl ? (
                                                            <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                                <img src={gift.imageUrl} alt="" className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                                <ShoppingBag size={16} className="text-slate-400" />
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-deepNavy truncate max-w-[200px]">{gift.title}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        {gift.price || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-700 font-medium">{gift.purchasedByName}</div>
                                                    <div className="text-xs text-slate-400 font-mono hidden sm:block">{gift.purchasedBy?.slice(0, 6)}...</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-slate-700 font-medium">{gift.ownerName}</div>
                                                    <div className="text-xs text-slate-400 font-mono hidden sm:block">{gift.ownerId.slice(0, 6)}...</div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    );
};

export default PurchasedGiftsPage;
