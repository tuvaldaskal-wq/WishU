import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getNextEventDate } from '../lib/utils';
import { useSearch } from '../context/SearchContext';
import { SendGreetingModal } from '../components/notifications/SendGreetingModal';

interface CalendarEvent {
    id: string; // usually friendUid
    friendId: string;
    friendName: string;
    friendPhoto?: string;
    type: 'birthday' | 'other';
    date: Date; // The NEXT occurrence
    dateStr: string; // "Jan 15"
    daysLeft: number;
    originalDate?: string; // "1990-01-15"
    title?: string; // "Birthday", "Wedding Anniversary", etc.
}

const CalendarPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { searchQuery } = useSearch();

    // State
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // 1. Get Accepted Friendships
                const q = query(collection(db, 'friendships'), where('users', 'array-contains', user.uid));
                const snap = await getDocs(q);

                const friendIds: string[] = [];
                snap.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.status === 'accepted') {
                        const fid = d.users.find((u: string) => u !== user.uid);
                        if (fid) friendIds.push(fid);
                    }
                });

                if (friendIds.length === 0) {
                    setEvents([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch Friend Profiles in chunks (limit 10 for 'in' query, or loop)
                // For MVP, loop Promise.all is fine for < 100 friends.
                const friendDocs = await Promise.all(friendIds.map(fid =>
                    getDocs(query(collection(db, 'users'), where('__name__', '==', fid)))
                ));

                const loadedEvents: CalendarEvent[] = [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                friendDocs.forEach(uSnap => {
                    if (!uSnap.empty) {
                        const d = uSnap.docs[0].data();
                        const uid = uSnap.docs[0].id;

                        // Debug Log
                        console.log(`Processing friend ${d.displayName}:`, d);

                        // 1. Process Birthday
                        if (d.birthDate) {
                            const next = getNextEventDate(d.birthDate);
                            if (next) {
                                loadedEvents.push({
                                    id: `${uid}_bday`,
                                    friendId: uid,
                                    friendName: d.displayName || 'Friend',
                                    friendPhoto: d.photoURL,
                                    type: 'birthday',
                                    date: next.date,
                                    dateStr: next.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                    daysLeft: next.daysLeft,
                                    originalDate: d.birthDate,
                                    title: 'Birthday'
                                });
                            }
                        }

                        // 2. Process Important Dates (Anniversaries, etc.)
                        if (d.importantDates && Array.isArray(d.importantDates)) {
                            console.log('Found important dates:', d.importantDates);
                            d.importantDates.forEach((impDate: any, idx: number) => {
                                console.log('Processing date:', impDate);
                                const next = getNextEventDate(impDate.date);
                                if (next) {
                                    loadedEvents.push({
                                        id: `${uid}_date_${idx}`,
                                        friendId: uid,
                                        friendName: d.displayName || 'Friend',
                                        friendPhoto: d.photoURL,
                                        type: 'other',
                                        date: next.date,
                                        dateStr: next.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                        daysLeft: next.daysLeft,
                                        originalDate: impDate.date,
                                        title: impDate.title || 'Special Day'
                                    });
                                } else {
                                    console.warn('Invalid date format:', impDate.date);
                                }
                            });
                        }
                    }
                });

                // 3. Automated Birthday Notifications
                // Check if any birthdays are in the next 3 days and create notifications
                const upcomingBdays = loadedEvents.filter(e => e.type === 'birthday' && e.daysLeft <= 3);
                for (const bday of upcomingBdays) {
                    const currentYear = new Date().getFullYear();
                    const notifId = `bday_${bday.friendId}_${currentYear}`;

                    // Check if we already created this notif
                    const checkQ = query(collection(db, 'notifications'), where('userId', '==', user.uid), where('data.notifKey', '==', notifId));
                    const checkSnap = await getDocs(checkQ);

                    if (checkSnap.empty) {
                        await addDoc(collection(db, 'notifications'), {
                            userId: user.uid,
                            type: 'birthday',
                            title: `${bday.friendName}'s birthday is approaching!`,
                            message: `It's in ${bday.daysLeft} ${bday.daysLeft === 1 ? 'day' : 'days'}. Check their wishlist for ideas.`,
                            data: {
                                friendId: bday.friendId,
                                friendName: bday.friendName,
                                notifKey: notifId
                            },
                            read: false,
                            createdAt: serverTimestamp()
                        });
                    }
                }

                // Sort by nearest date
                loadedEvents.sort((a, b) => a.daysLeft - b.daysLeft);
                console.log('Final Loaded Events:', loadedEvents);
                setEvents(loadedEvents);

            } catch (err) {
                console.error("Error fetching calendar:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const filteredEvents = events.filter(e =>
        e.friendName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white font-sans">
            <main className="px-6 space-y-4 pt-6 pb-28">
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : filteredEvents.length === 0 ? (
                    <div className="text-center mt-10 p-6 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <CalendarIcon size={32} />
                        </div>
                        <p className="text-slate-500 font-medium mb-1">No upcoming events found.</p>
                        <p className="text-xs text-slate-400 mb-4">Add friends or ask them to set their birthday!</p>
                        <button onClick={() => navigate('/friends')} className="bg-darkbg text-white px-4 py-2 rounded-xl text-sm font-bold">
                            Find Friends
                        </button>
                    </div>
                ) : (
                    filteredEvents.map(event => (
                        <div
                            key={event.id}
                            onClick={() => navigate(`/friend/${event.friendId}`)} // Go to their wall
                            className="flex items-center gap-4 py-4 border-b border-slate-50 active:opacity-70 transition-opacity cursor-pointer"
                        >
                            <div className="relative">
                                <img src={event.friendPhoto || `https://ui-avatars.com/api/?name=${event.friendName}`} alt={event.friendName} className="w-12 h-12 rounded-full object-cover bg-slate-200" />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-white text-[10px]">
                                    🎂
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-800">{event.friendName}</h3>
                                <p className="text-sm text-slate-500">{event.dateStr} • {event.title}</p>
                            </div>
                            <div className="text-center min-w-[50px]">
                                <span className="block text-xl font-bold text-primary">{event.daysLeft}</span>
                                <span className="text-[10px] text-slate-400 uppercase font-medium">Days</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEvent(event);
                                }}
                                className="bg-secondary p-2 rounded-xl text-slate-600 hover:bg-slate-200"
                            >
                                <Mail size={18} />
                            </button>
                        </div>
                    ))
                )}
            </main>

            {/* Greeting Card Modal */}
            <SendGreetingModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                recipient={{
                    uid: selectedEvent?.friendId || '',
                    name: selectedEvent?.friendName || '',
                    photoURL: selectedEvent?.friendPhoto
                }}
                eventType={selectedEvent?.type || 'birthday'}
            />

        </div >
    );
};

export default CalendarPage;
