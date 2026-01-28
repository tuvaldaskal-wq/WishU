import { useState, useRef, useEffect } from 'react';
import { Bell, X, Mail, Cake, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, Notification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface NotificationBellProps {
    onOpenGreeting: (greetingId: string) => void;
}

export const NotificationBell = ({ onOpenGreeting }: NotificationBellProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, loading } = useNotifications();
    const navigate = useNavigate();
    const drawerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = async (notif: Notification) => {
        setIsOpen(false);
        if (!notif.read) {
            await markAsRead(notif.id);
        }

        if (notif.type === 'greeting' && notif.data.greetingId) {
            onOpenGreeting(notif.data.greetingId);
        } else if (notif.type === 'birthday' && notif.data.friendId) {
            navigate(`/friend/${notif.data.friendId}`);
        }
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-primary hover:bg-slate-50 rounded-full transition-colors relative"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-accent text-darkbg text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Mobile Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] sm:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            ref={drawerRef}
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-[320px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-100 z-[70] overflow-hidden flex flex-col max-h-[500px]"
                        >
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
                                <h3 className="font-bold text-darkbg">Notifications</h3>
                                <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="overflow-y-auto scrollbar-thin">
                                {loading && (
                                    <div className="p-10 flex justify-center">
                                        <Loader2 className="animate-spin text-primary" />
                                    </div>
                                )}

                                {!loading && notifications.length === 0 && (
                                    <div className="p-12 text-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                            <Bell size={24} />
                                        </div>
                                        <p className="text-sm text-slate-400">No notifications yet</p>
                                    </div>
                                )}

                                {!loading && notifications.map((notif) => (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start gap-3 relative ${!notif.read ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                            ${notif.type === 'greeting' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}
                                        `}>
                                            {notif.type === 'greeting' ? <Mail size={16} /> : <Cake size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-darkbg mb-0.5">{notif.title}</p>
                                            {notif.message && <p className="text-xs text-slate-500 line-clamp-2">{notif.message}</p>}
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-medium">
                                                {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        )}
                                        <div className="mt-2 text-slate-300">
                                            <ArrowRight size={14} />
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 bg-slate-50 text-center">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-xs text-slate-500 font-bold hover:text-primary"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
