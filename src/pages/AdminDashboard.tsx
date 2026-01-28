import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, getCountFromServer, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StatsCard } from '../components/admin/StatsCard';
import { BottomNav } from '../components/BottomNav';
import { Users, Gift, MessageSquare, Bell, Activity, ShoppingBag, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ActivityItem {
    id: string;
    type: 'user' | 'gift' | 'greeting';
    title: string;
    subtitle: string;
    timestamp: Timestamp;
    image?: string;
}

import { useNotifications } from '../context/NotificationContext';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { requestPermission } = useNotifications();
    const [stats, setStats] = useState({
        users: 0,
        wishes: 0,
        greetings: 0,
        notifications: 0,
        purchasedCount: 0,
        totalValue: 0
    });
    const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
    const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. Fetch Counts
                const usersCol = collection(db, 'users');
                const giftsCol = collection(db, 'gifts'); // Wishes
                const greetingsCol = collection(db, 'greetings');
                const notifsCol = collection(db, 'NotificationQueue');

                // Using getCountFromServer for efficient counting
                const [usersSnap, giftsSnap, greetingsSnap, recentNotifsSnap] = await Promise.all([
                    getCountFromServer(usersCol),
                    getCountFromServer(giftsCol),
                    getCountFromServer(greetingsCol),
                    getDocs(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(5)))
                ]);

                console.log("Recent notifications:", recentNotifsSnap.docs.map(d => d.data()));

                // Handle NotificationQueue separately as it might not exist yet or be empty
                let notifCount = 0;
                try {
                    const notifSnap = await getCountFromServer(notifsCol);
                    notifCount = notifSnap.data().count;
                } catch (e) {
                    console.log("NotificationQueue collection might not exist yet", e);
                }

                // Fetch Purchased Gifts & Calculate Value
                const purchasedQuery = query(giftsCol, where('status', '==', 'purchased'));
                const purchasedSnap = await getDocs(purchasedQuery);
                const purchasedCount = purchasedSnap.size;

                let totalValue = 0;
                purchasedSnap.forEach(doc => {
                    const data = doc.data();
                    if (data.price) {
                        // Extract numeric value from price string (e.g. "₪120", "$50.00", "100")
                        const numericPrice = parseFloat(data.price.toString().replace(/[^0-9.]/g, ''));
                        if (!isNaN(numericPrice)) {
                            totalValue += numericPrice;
                        }
                    }
                });

                setStats({
                    users: usersSnap.data().count,
                    wishes: giftsSnap.data().count,
                    greetings: greetingsSnap.data().count,
                    notifications: notifCount,
                    purchasedCount,
                    totalValue: Math.round(totalValue)
                });

                // 2. Fetch Recent Activity (Top 20 from each to merge)
                const recentUsersQ = query(usersCol, orderBy('createdAt', 'desc'), limit(20));
                const recentGiftsQ = query(giftsCol, orderBy('createdAt', 'desc'), limit(20));
                const recentGreetingsQ = query(greetingsCol, orderBy('createdAt', 'desc'), limit(20));

                const [usersDocs, giftsDocs, greetingsDocs] = await Promise.all([
                    getDocs(recentUsersQ),
                    getDocs(recentGiftsQ),
                    getDocs(recentGreetingsQ)
                ]);

                const activities: ActivityItem[] = [];

                usersDocs.forEach(doc => {
                    const data = doc.data();
                    if (data.createdAt) { // Ensure timestamp exists
                        activities.push({
                            id: doc.id,
                            type: 'user',
                            title: 'New User Joined',
                            subtitle: data.displayName || data.email || 'Anonymous',
                            timestamp: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt)), // Handle string dates if any
                            image: data.photoURL
                        });
                    }
                });

                giftsDocs.forEach(doc => {
                    const data = doc.data();
                    if (data.createdAt) {
                        activities.push({
                            id: doc.id,
                            type: 'gift',
                            title: 'New Wish Added',
                            subtitle: data.title,
                            timestamp: data.createdAt,
                            image: data.image
                        });
                    }
                });

                greetingsDocs.forEach(doc => {
                    const data = doc.data();
                    if (data.createdAt) {
                        activities.push({
                            id: doc.id,
                            type: 'greeting',
                            title: 'Greeting Sent',
                            subtitle: `From ${data.senderName} to ${data.recipientName || 'Friend'}`,
                            timestamp: data.createdAt
                        });
                    }
                });

                // Sort merged list and take top 20
                activities.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
                setActivityFeed(activities.slice(0, 20));

                // Helper for debug section
                setRecentNotifications(recentNotifsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                (window as any).recentNotifs = recentNotifsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            } catch (error) {
                console.error("Error fetching admin data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading dashboard data...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primaryPink rounded-xl flex items-center justify-center text-white font-bold text-xl">
                        A
                    </div>
                    <h1 className="text-xl font-bold text-deepNavy">Admin Dashboard v2.0</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 pb-32">
                <div className="mb-6 flex justify-end gap-3">
                    <button
                        onClick={requestPermission}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 transition-all"
                    >
                        ENABLE NOTIFICATIONS
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                                // Hardcoded ID for testing based on user request
                                await addDoc(collection(db, 'notifications'), {
                                    userId: 'SnlRjWGr53crY65mNXKIc8tWoFE3',
                                    title: 'Test from Dashboard v2',
                                    message: 'This is a valid test!',
                                    type: 'test',
                                    createdAt: serverTimestamp()
                                });
                                alert('Test notification sent!');
                            } catch (e) {
                                alert('Error sending test: ' + e);
                                console.error(e);
                            }
                        }}
                        className="px-6 py-3 bg-primaryPink text-white rounded-xl font-bold shadow-lg shadow-pink-200 hover:scale-105 active:scale-95 transition-all"
                    >
                        SEND TEST NOTIFICATION
                    </button>
                </div>

                {/* Debug: List Recent Notifications */}
                <div className="mb-10 p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-deepNavy mb-4">Recent Notifications (Debug)</h3>
                    <div className="space-y-2">
                        {stats.notifications === 0 && <p className="text-slate-400">No pending notifications found via stats count.</p>}
                        {recentNotifications.length > 0 ? (
                            recentNotifications.map(n => (
                                <div key={n.id} className="p-3 bg-slate-50 rounded border border-slate-100 text-sm">
                                    <p><strong>ID:</strong> {n.id}</p>
                                    <p><strong>Title:</strong> {n.title}</p>
                                    <p><strong>Created:</strong> {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleString() : 'Pending...'}</p>
                                    <p><strong>UserID:</strong> {n.userId}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-400 text-sm">No recent notifications fetched.</p>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatsCard
                        title="Total Users"
                        value={stats.users}
                        icon={<Users size={24} />}
                    />
                    <StatsCard
                        title="Total Wishes"
                        value={stats.wishes}
                        icon={<Gift size={24} />}
                    />
                    <StatsCard
                        title="Engagement (Greetings)"
                        value={stats.greetings}
                        icon={<MessageSquare size={24} />}
                    />
                    <StatsCard
                        title="Pending Notifications"
                        value={stats.notifications}
                        icon={<Bell size={24} />}
                    />
                    <StatsCard
                        title="Purchased Gifts"
                        value={stats.purchasedCount}
                        icon={<ShoppingBag size={24} />}
                        onClick={() => navigate('/admin/purchased')}
                    />
                    <StatsCard
                        title="Total Value"
                        value={`₪${stats.totalValue.toLocaleString()}`}
                        icon={<Banknote size={24} />}
                    />
                </section>

                {/* Activity Feed */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
                        <Activity className="text-primaryPink" size={20} />
                        <h2 className="text-lg font-bold text-deepNavy">Recent Activity</h2>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-[800px] overflow-y-auto">
                        {activityFeed.map((item) => (
                            <div key={`${item.type}-${item.id}`} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                                    ${item.type === 'user' ? 'bg-blue-100 text-blue-600' :
                                        item.type === 'gift' ? 'bg-pink-100 text-pink-600' :
                                            'bg-amber-100 text-amber-600'
                                    }`}>
                                    {item.type === 'user' && <Users size={18} />}
                                    {item.type === 'gift' && <Gift size={18} />}
                                    {item.type === 'greeting' && <MessageSquare size={18} />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-deepNavy truncate">{item.title}</p>
                                    <p className="text-sm text-slate-500 truncate">{item.subtitle}</p>
                                </div>

                                <div className="text-xs text-slate-400 whitespace-nowrap">
                                    {item.timestamp.toDate().toLocaleDateString()} {item.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}

                        {activityFeed.length === 0 && (
                            <div className="p-8 text-center text-slate-400 text-sm">
                                No recent activity found.
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <BottomNav />
        </div>
    );
};

export default AdminDashboard;
