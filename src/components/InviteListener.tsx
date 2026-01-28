import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export const InviteListener = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const processedRef = useRef(false);

    useEffect(() => {
        const checkInvite = async () => {
            if (!user) return;
            if (processedRef.current) return;

            const pendingInvite = localStorage.getItem('pendingInvite');
            if (!pendingInvite) return;

            // Don't friend yourself
            if (pendingInvite === user.uid) {
                localStorage.removeItem('pendingInvite');
                return;
            }

            try {
                // Check if friendship already exists to avoid duplicates
                const q = query(
                    collection(db, 'friendships'),
                    where('users', 'array-contains', user.uid)
                );
                const snapshot = await getDocs(q);
                const exists = snapshot.docs.some(doc => {
                    const data = doc.data();
                    return data.users.includes(pendingInvite);
                });

                if (!exists) {
                    await addDoc(collection(db, 'friendships'), {
                        users: [user.uid, pendingInvite],
                        senderId: pendingInvite, // Original inviter
                        status: 'accepted', // Auto-accept
                        createdAt: serverTimestamp()
                    });
                    showToast("You are now connected with your friend!", "success");
                }

                localStorage.removeItem('pendingInvite');
                processedRef.current = true;

            } catch (error) {
                console.error("Error creating friendship from invite:", error);
            }
        };

        checkInvite();
    }, [user, showToast]);

    return null; // Logic only component
};
