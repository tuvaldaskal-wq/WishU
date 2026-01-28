import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';

const InviteHandler = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { showToast } = useToast();
    const processed = useRef(false);

    useEffect(() => {
        if (loading) return; // Wait for Auth check
        if (processed.current) return;

        const handleInvite = async () => {
            const fromId = searchParams.get('from');
            if (!fromId) {
                navigate('/');
                return;
            }

            // Scenario A: User is logged in
            if (user) {
                processed.current = true;
                if (user.uid === fromId) {
                    navigate('/dashboard');
                    return;
                }

                try {
                    // Check existence
                    const q = query(collection(db, 'friendships'), where('users', 'array-contains', user.uid));
                    const snap = await getDocs(q);
                    const exists = snap.docs.some(d => d.data().users.includes(fromId));

                    if (!exists) {
                        await addDoc(collection(db, 'friendships'), {
                            users: [user.uid, fromId],
                            senderId: fromId,
                            status: 'accepted',
                            createdAt: serverTimestamp()
                        });
                        showToast("You are now connected!", "success");
                    }
                    // Redirect to Inviter's Wall
                    navigate(`/friend/${fromId}`);
                } catch (e) {
                    console.error("Invite error", e);
                    navigate('/');
                }
            }
            // Scenario B: User is NOT logged in
            else {
                localStorage.setItem('pendingInvite', fromId);
                navigate('/'); // Will trigger login/signup flow on landing
            }
        };

        handleInvite();
    }, [searchParams, user, loading, navigate, showToast]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-darkbg text-primary">
            Connecting...
        </div>
    );
};

export default InviteHandler;
