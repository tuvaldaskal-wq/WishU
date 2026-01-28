import { Home, Users, Calendar, User as UserIcon, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
    onAddClick?: () => void;
}

export const BottomNav = ({ onAddClick }: BottomNavProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const path = location.pathname;
    const [pendingCount, setPendingCount] = useState(0);

    const isActive = (route: string) => {
        if (route === '/dashboard') return path === '/dashboard' || path === '/';
        return path === route || path.startsWith(route + '/');
    };

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'friendships'),
            where('receiverId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPendingCount(snapshot.docs.length);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto">
            {/* The Main Navy Bar */}
            <div className="bg-primary pt-3 pb-6 px-4 flex justify-around items-center border-t border-white/5 shadow-[0_-5px_25px_rgba(0,0,0,0.3)] relative min-h-[85px]">

                {/* Left Icons */}
                <div className="flex flex-1 justify-around items-center">
                    <NavIcon
                        icon={<Home size={24} strokeWidth={2.5} />}
                        label="Home"
                        active={isActive('/dashboard')}
                        onClick={() => navigate('/dashboard')}
                    />
                    <div className="relative">
                        <NavIcon
                            icon={<Users size={24} strokeWidth={2.5} />}
                            label="Friends"
                            active={isActive('/friends')}
                            onClick={() => navigate('/friends')}
                        />
                        {pendingCount > 0 && (
                            <div className="absolute top-1 -right-1 bg-secondary text-primary text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                {pendingCount}
                            </div>
                        )}
                    </div>
                </div>

                {/* Central Action: Pop-out FAB */}
                <div className="relative flex justify-center w-20">
                    <motion.button
                        whileHover={{ scale: 1.1, y: -45 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAddClick}
                        className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center shadow-[0_10px_20px_rgba(231,155,227,0.3)] text-white cursor-pointer absolute -top-12 border-4 border-white transition-all active:shadow-inner"
                    >
                        <Plus size={36} strokeWidth={3.5} />
                    </motion.button>
                </div>

                {/* Right Icons */}
                <div className="flex flex-1 justify-around items-center">
                    <NavIcon
                        icon={<Calendar size={24} strokeWidth={2.5} />}
                        label="Dates"
                        active={isActive('/calendar')}
                        onClick={() => navigate('/calendar')}
                    />
                    <NavIcon
                        icon={<UserIcon size={24} strokeWidth={2.5} />}
                        label="Profile"
                        active={isActive('/profile')}
                        onClick={() => navigate('/profile')}
                    />
                </div>
            </div>
        </div>
    );
};

const NavIcon = ({ icon, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) => (
    <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`p-2 transition-all duration-300 relative group flex flex-col items-center justify-center ${active ? 'text-white' : 'text-white/80 hover:text-white'}`}
    >
        {active ? (
            <div className="flex flex-col items-center">
                {icon}
                <motion.div
                    layoutId="active-dot"
                    className="w-1.5 h-1.5 bg-secondary rounded-full mt-1"
                />
            </div>
        ) : (
            icon
        )}
    </motion.button>
);
