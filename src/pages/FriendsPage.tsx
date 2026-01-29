import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Check, X, Share2, Loader2, Sparkles, Search, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSearch } from '../context/SearchContext';

// Cloud Function URL
const SEARCH_USERS_URL = 'https://europe-west1-wishu-c16d5.cloudfunctions.net/searchUsers';

const FriendsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { searchQuery } = useSearch();

    const [friends, setFriends] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // New state for global search
    const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
    const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
    const [existingFriendIds, setExistingFriendIds] = useState<Set<string>>(new Set());

    // RESTORED: Listen for Friendships (Friends & Pending Requests)
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'friendships'),
            where('users', 'array-contains', user.uid)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const allDocs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            // Process Pending Requests (Received)
            const pending = await Promise.all(allDocs
                .filter((d: any) => d.status === 'pending' && d.senderId !== user.uid)
                .map(async (d: any) => {
                    const senderId = d.senderId;
                    const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', senderId)));
                    const userData = userSnap.empty ? { displayName: 'Unknown' } : userSnap.docs[0].data();
                    return { ...d, friend: { uid: senderId, ...userData } };
                }));
            setPendingRequests(pending);

            // Process Accepted Friends
            const accepted = await Promise.all(allDocs
                .filter((d: any) => d.status === 'accepted')
                .map(async (d: any) => {
                    const friendId = d.users.find((u: string) => u !== user.uid);
                    if (!friendId) return null;

                    const userSnap = await getDocs(query(collection(db, 'users'), where('__name__', '==', friendId)));
                    const userData = userSnap.empty ? { displayName: 'User' } : userSnap.docs[0].data();
                    return { ...d, friendId, friend: { uid: friendId, ...userData } };
                }));

            setFriends(accepted.filter(Boolean));

            // Track all friend IDs (accepted + pending sent)
            const friendIds = new Set<string>();
            allDocs.forEach((d: any) => {
                d.users.forEach((uid: string) => {
                    if (uid !== user.uid) friendIds.add(uid);
                });
            });
            setExistingFriendIds(friendIds);

            // Track sent requests
            const sentIds = new Set<string>();
            allDocs
                .filter((d: any) => d.status === 'pending' && d.senderId === user.uid)
                .forEach((d: any) => sentIds.add(d.receiverId));
            setSentRequests(sentIds);

            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Global search effect - debounced
    useEffect(() => {
        if (!user || !searchQuery || searchQuery.length < 2) {
            setGlobalSearchResults([]);
            return;
        }

        // Check if local search has results
        const localMatches = friends.filter(f =>
            f.friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // If we have local matches, don't search globally
        if (localMatches.length > 0) {
            setGlobalSearchResults([]);
            return;
        }

        // Debounce global search
        const timer = setTimeout(async () => {
            setIsSearchingGlobal(true);
            try {
                const response = await fetch(SEARCH_USERS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: searchQuery, requesterId: user.uid }),
                });
                const data = await response.json();

                // Filter out existing friends/pending
                const filtered = (data.users || []).filter((u: any) =>
                    !existingFriendIds.has(u.uid)
                );
                setGlobalSearchResults(filtered);
            } catch (err) {
                console.error('Global search failed:', err);
                setGlobalSearchResults([]);
            }
            setIsSearchingGlobal(false);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery, user, friends, existingFriendIds]);

    const filteredFriends = friends.filter(f =>
        f.friend.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Send friend request
    const sendFriendRequest = async (targetUser: any) => {
        if (!user) return;

        try {
            // Create friendship document
            await addDoc(collection(db, 'friendships'), {
                users: [user.uid, targetUser.uid],
                senderId: user.uid,
                receiverId: targetUser.uid,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            // Create notification for target user
            await addDoc(collection(db, 'notifications'), {
                userId: targetUser.uid,
                type: 'friend_request',
                title: 'New Friend Request',
                message: `${user.displayName || 'Someone'} wants to connect with you!`,
                data: {
                    senderId: user.uid,
                    senderName: user.displayName || 'Unknown',
                    senderPhoto: user.photoURL || '',
                },
                read: false,
                createdAt: serverTimestamp(),
            });

            // Update local state
            setSentRequests(prev => new Set(prev).add(targetUser.uid));
            setGlobalSearchResults(prev => prev.filter(u => u.uid !== targetUser.uid));

        } catch (err) {
            console.error('Failed to send friend request:', err);
        }
    };

    const acceptRequest = async (friendshipId: string) => {
        try {
            await updateDoc(doc(db, 'friendships', friendshipId), {
                status: 'accepted'
            });
        } catch (err) { console.error(err); }
    };

    const declineRequest = async (friendshipId: string) => {
        try {
            await deleteDoc(doc(db, 'friendships', friendshipId));
        } catch (err) { console.error(err); }
    };

    const handleShareProfile = async () => {
        if (!user) return;
        const shareData = {
            title: 'Join me on WishU',
            text: 'Let\'s share wishlists on WishU! Join me here:',
            url: `${window.location.origin}/invite?from=${user.uid}`
        };
        try {
            if (navigator.share) await navigator.share(shareData);
            else {
                navigator.clipboard.writeText(shareData.url);
                alert("Link copied!");
            }
        } catch (err) { console.log(err); }
    };

    return (
        <div className="bg-white font-sans">
            <main className="px-6 space-y-8 pt-6 pb-28">

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <section>
                        <h2 className="font-bold text-darkbg mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                            Friend Requests
                        </h2>
                        <div className="space-y-3">
                            {pendingRequests.map(req => (
                                <div key={req.id} className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <img src={req.friend.photoURL || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full bg-slate-200" />
                                        <div>
                                            <p className="font-bold text-darkbg text-sm">{req.friend.displayName || 'Unknown'}</p>
                                            <p className="text-xs text-slate-400">Wants to connect</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => declineRequest(req.id)} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500"><X size={18} /></button>
                                        <button onClick={() => acceptRequest(req.id)} className="p-2 bg-primary/10 text-primary rounded-full hover:bg-primary hover:text-white"><Check size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Global Search Results */}
                {searchQuery && searchQuery.length >= 2 && (filteredFriends.length === 0 || globalSearchResults.length > 0) && (
                    <section>
                        <h2 className="font-bold text-darkbg mb-3 flex items-center gap-2">
                            <Search size={16} className="text-primary" />
                            {isSearchingGlobal ? 'Searching...' : 'Find New Friends'}
                        </h2>

                        {isSearchingGlobal ? (
                            <div className="flex justify-center p-6">
                                <Loader2 className="animate-spin text-primary" />
                            </div>
                        ) : globalSearchResults.length > 0 ? (
                            <div className="space-y-3">
                                {globalSearchResults.map(foundUser => (
                                    <div key={foundUser.uid} className="bg-gradient-to-r from-primary/5 to-accent/5 p-4 rounded-2xl border border-primary/10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={foundUser.photoURL || `https://ui-avatars.com/api/?name=${foundUser.displayName}`}
                                                className="w-10 h-10 rounded-full bg-slate-200"
                                                alt={foundUser.displayName}
                                            />
                                            <div>
                                                <p className="font-bold text-darkbg text-sm">{foundUser.displayName}</p>
                                                <p className="text-xs text-slate-400">{foundUser.email}</p>
                                            </div>
                                        </div>
                                        {sentRequests.has(foundUser.uid) ? (
                                            <span className="px-4 py-2 text-slate-400 text-sm">Request Sent</span>
                                        ) : (
                                            <button
                                                onClick={() => sendFriendRequest(foundUser)}
                                                className="flex items-center gap-1 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                                            >
                                                <UserPlus size={16} />
                                                Connect
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : filteredFriends.length === 0 && !isSearchingGlobal ? (
                            <div className="text-center py-6 px-4 bg-slate-50 rounded-xl">
                                <p className="text-slate-500 text-sm">No users found matching "{searchQuery}"</p>
                                <p className="text-slate-400 text-xs mt-1">Try a different name or email</p>
                            </div>
                        ) : null}
                    </section>
                )}

                {/* Friends List */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-darkbg">Your Friends ({filteredFriends.length})</h2>
                        <button onClick={handleShareProfile} className="text-primary text-sm font-medium flex items-center gap-1">
                            <Share2 size={16} /> Invite
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                    ) : filteredFriends.length === 0 ? (
                        <div className="text-center py-10 px-6 bg-white rounded-3xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <UsersIcon size={32} />
                            </div>
                            <h3 className="font-bold text-slate-700 mb-1">No friends yet</h3>
                            <p className="text-sm text-slate-400 mb-4">Search for people above or invite them to join WishU!</p>
                            <button onClick={handleShareProfile} className="bg-darkbg text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg">
                                Invite Friends
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredFriends.map(friendship => (
                                <div
                                    key={friendship.id}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 hover:border-primary/20 flex flex-col gap-3"
                                >
                                    <div
                                        onClick={() => navigate(`/friend/${friendship.friendId}`)}
                                        className="flex items-center gap-4 cursor-pointer"
                                    >
                                        <div className="relative">
                                            <img src={friendship.friend.photoURL || `https://ui-avatars.com/api/?name=${friendship.friend.displayName}`} alt={friendship.friend.displayName} className="w-12 h-12 rounded-full object-cover bg-slate-200" />
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800">{friendship.friend.displayName}</h3>
                                            <p className="text-xs text-slate-400">Tap to see wishlist</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-slate-400">
                                            <Sparkles size={16} />
                                        </div>
                                    </div>

                                    {/* Group Selector */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                                        <span className="text-xs text-slate-400">Group:</span>
                                        <select
                                            value={friendship.groups?.[friendship.friendId] || 'Friends'}
                                            onChange={async (e) => {
                                                const newGroup = e.target.value;
                                                // Update firestore: groups map key is friendId (Target), value is Group assigned by ME (Viewer/CurrentUser)
                                                // Actually, since doc is shared, we need to be careful.
                                                // Structure: groups: { [friendId]: 'Work' } -> means "Currently assigned group for friendId is Work"
                                                // But wait, who assigned it?
                                                // A shared doc approach is flawed for private tagging unless we key by ASSIGNER.
                                                // BUT, for this MVP, let's assume `groups` field is `groups: { [TargetUserID]: AssignedGroup }`.
                                                // Since I am editing `friendship` doc, I want to set MY tag for THEM.
                                                // So key should be THEM `friendId`. 
                                                // Limitation: If THEY also tag ME, they will write to `groups[myUid]`.
                                                // No conflict as long as keys are different users.

                                                await updateDoc(doc(db, 'friendships', friendship.id), {
                                                    [`groups.${friendship.friendId}`]: newGroup
                                                });
                                            }}
                                            className="bg-slate-50 text-xs font-medium text-slate-600 rounded-lg px-2 py-1 border border-slate-200 focus:outline-none focus:border-primary"
                                        >
                                            <option value="Friends">Friends</option>
                                            <option value="Family">Family</option>
                                            <option value="Partner">Partner</option>
                                            <option value="Work">Work</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>


        </div>
    );
};

export default FriendsPage;
