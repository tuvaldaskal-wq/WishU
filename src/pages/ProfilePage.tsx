import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { User, Bell, Share2, LogOut, Camera, Copy, Check, Plus, X, Shield } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const ProfilePage = () => {
    const { t } = useTranslation();
    const { user, userProfile, logout } = useAuth();
    const { requestPermission } = useNotifications();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [notificationPreferences, setNotificationPreferences] = useState<any>({
        Friends: { enabled: true, first: '1week', second: '1day' },
        Family: { enabled: true, first: '1week', second: '1day' },
        Partner: { enabled: true, first: '1week', second: '1day' },
        Work: { enabled: true, first: '1week', second: '1day' },
        Other: { enabled: true, first: '1week', second: '1day' },
    });
    const [loading, setLoading] = useState(false);
    const [justCopied, setJustCopied] = useState(false);
    // Date inputs state
    const [newDateTitle, setNewDateTitle] = useState('');
    const [newDateVal, setNewDateVal] = useState('');
    const [newDateType, setNewDateType] = useState('birthday');
    // Local state for immediate UI feedback
    const [localDates, setLocalDates] = useState<any[]>([]);

    useEffect(() => {
        if (userProfile?.importantDates) {
            setLocalDates(userProfile.importantDates);
        }
    }, [userProfile]);

    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || '');
            // Check both 'birthDate' (new schema) and 'dob' (old schema from Onboarding if exists in any)
            setBirthDate(userProfile.birthDate || (userProfile as any).dob || '');
            setPhotoURL(userProfile.photoURL || user?.photoURL || '');
            setNotificationsEnabled((userProfile as any).notificationsEnabled || false);
            if (userProfile.notificationPreferences) {
                setNotificationPreferences(userProfile.notificationPreferences);
            }
        }
    }, [userProfile, user]);

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                displayName,
                birthDate,
                photoURL,
                notificationsEnabled,
                notificationPreferences
            });
            alert(t('profile_updated'));
        } catch (error) {
            console.error(error);
            alert('Error updating profile');
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!user) return;
        const shareData = {
            title: 'My Wishlist on WishU',
            text: `Hey! Check out my wishlist on WishU:`,
            url: `${window.location.origin}/invite?from=${user.uid}`
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            // Fallback copy
            navigator.clipboard.writeText(shareData.url);
            setJustCopied(true);
            setTimeout(() => setJustCopied(false), 2000);
        }
    };

    const toggleNotifications = async () => {
        const newState = !notificationsEnabled;
        setNotificationsEnabled(newState);

        if (newState) {
            await requestPermission();
        }
    };

    const updatePreference = (group: string, field: string, value: any) => {
        setNotificationPreferences((prev: any) => ({
            ...prev,
            [group]: {
                ...prev[group],
                [field]: value
            }
        }));
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const firstReminderOptions = [
        { label: '1 month before', value: '1month' },
        { label: '2 weeks before', value: '2weeks' },
        { label: '1 week before', value: '1week' },
        { label: '3 days before', value: '3days' }
    ];

    const secondReminderOptions = [
        { label: '1 day before', value: '1day' },
        { label: 'On the day of', value: 'on-day' },
        { label: 'None', value: 'none' }
    ];

    return (
        <div className="bg-white font-sans">
            <main className="px-6 space-y-8 pb-32">
                {/* Profile Picture */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg">
                            {photoURL ? (
                                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-full h-full p-6 text-slate-400" />
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                            <Camera size={16} />
                        </button>
                    </div>
                </div>

                {/* Language Settings */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                            <span className="text-lg font-bold">Aa</span>
                        </div>
                        <div>
                            <h2 className="font-bold text-darkbg">{t('language_settings')}</h2>
                            <p className="text-xs text-slate-400">{t('select_language')}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => i18n.changeLanguage('en')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${i18n.language === 'en'
                                ? 'bg-darkbg text-white shadow-md'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            English
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage('he')}
                            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${i18n.language === 'he'
                                ? 'bg-darkbg text-white shadow-md'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            עברית
                        </button>
                    </div>
                </div>

                {/* Edit Details */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-darkbg mb-4 flex items-center gap-2">
                        <User size={20} className="text-primary" />
                        {t('onboarding_step1_title')}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('full_name')}</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-darkbg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t('birth_date')}</label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-darkbg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-100 mt-6">
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Other Important Dates</label>

                            <div className="space-y-3 mb-4">
                                {localDates.map((date: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-bold text-darkbg text-sm">{date.title}</p>
                                            <p className="text-xs text-slate-500 capitalize">{date.type} • {date.date}</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!user) return;
                                                const newDates = [...localDates];
                                                newDates.splice(index, 1);
                                                setLocalDates(newDates); // Optimistic update
                                                await updateDoc(doc(db, 'users', user.uid), { importantDates: newDates });
                                            }}
                                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 items-end">
                                <div className="flex-1 space-y-2">
                                    <input
                                        placeholder="Title (e.g. Anniversary)"
                                        value={newDateTitle}
                                        onChange={(e) => setNewDateTitle(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={newDateVal}
                                            onChange={(e) => setNewDateVal(e.target.value)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                                        />
                                        <select
                                            value={newDateType}
                                            onChange={(e) => setNewDateType(e.target.value)}
                                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm"
                                        >
                                            <option value="birthday">Birthday</option>
                                            <option value="anniversary">Anniversary</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        if (!user) return;
                                        if (!newDateTitle || !newDateVal) return;

                                        const newDate = {
                                            title: newDateTitle,
                                            date: newDateVal,
                                            type: newDateType
                                        };

                                        // Optimistic Update
                                        const updatedDates = [...localDates, newDate];
                                        setLocalDates(updatedDates);

                                        // Clear inputs immediately
                                        setNewDateTitle('');
                                        setNewDateVal('');

                                        // Save to DB
                                        await updateDoc(doc(db, 'users', user.uid), {
                                            importantDates: updatedDates
                                        });

                                        alert(t('date_added') || "Date added! It will appear on your calendar.");
                                    }}
                                    className="bg-darkbg text-white p-3 rounded-xl shadow-lg hover:bg-black transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                            {(newDateTitle || newDateVal) && (
                                <p className="text-red-500 text-xs mt-2 font-bold animate-pulse">
                                    Don't forget to click (+) to add this date!
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* General Notifications Toggle */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-darkbg mb-4 flex items-center gap-2">
                        <Bell size={20} className="text-primary" />
                        {t('notifications_title')}
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-darkbg">{t('push_notifications')}</p>
                            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{t('push_notifications_desc')}</p>
                        </div>
                        <button
                            onClick={toggleNotifications}
                            className={`w-12 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                </section>

                {/* Per-Group Notification Preferences */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-lg font-bold text-darkbg mb-6 flex items-center gap-2">
                        <Bell size={20} className="text-primary" />
                        Notification Preferences
                    </h2>

                    <div className="space-y-8">
                        {['Friends', 'Family', 'Partner', 'Work', 'Other'].map(group => {
                            const pref = notificationPreferences[group] || { enabled: true, first: '1week', second: '1day' };
                            return (
                                <div key={group} className="space-y-4 border-b border-slate-50 pb-6 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-darkbg flex items-center gap-2">
                                            {group}
                                        </h3>
                                        <button
                                            onClick={() => updatePreference(group, 'enabled', !pref.enabled)}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${pref.enabled ? 'bg-primary' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${pref.enabled ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>

                                    {pref.enabled && (
                                        <div className="grid grid-cols-1 gap-4 mt-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">First Reminder</label>
                                                <select
                                                    value={pref.first}
                                                    onChange={(e) => updatePreference(group, 'first', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-darkbg outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                                >
                                                    {firstReminderOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Follow-up Reminder</label>
                                                <select
                                                    value={pref.second}
                                                    onChange={(e) => updatePreference(group, 'second', e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-darkbg outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                                >
                                                    {secondReminderOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Share */}
                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-lg font-bold text-darkbg mb-4 flex items-center gap-2">
                        <Share2 size={20} className="text-primary" />
                        {t('share_title')}
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">{t('share_desc')}</p>
                    <button
                        onClick={handleShare}
                        className="w-full py-3 bg-darkbg text-white rounded-xl font-bold shadow-lg shadow-darkbg/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                        {justCopied ? <Check size={18} /> : <Share2 size={18} />}
                        {justCopied ? t('copied') : t('share_button')}
                    </button>

                    {/* Public Viewing Link Display */}
                    {user && (
                        <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center justify-between gap-2 overflow-hidden border border-slate-200">
                            <span className="text-xs text-slate-500 truncate font-mono">
                                {window.location.origin}/invite?from={user.uid}
                            </span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/invite?from=${user.uid}`);
                                    setJustCopied(true);
                                    setTimeout(() => setJustCopied(false), 2000);
                                }}
                                className="p-2 bg-white rounded-md shadow-sm border border-slate-100 hover:text-primary"
                            >
                                {justCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>
                    )}
                </section>

                {/* Admin Dashboard Access */}
                {(userProfile?.isAdmin) && (
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group cursor-pointer" onClick={() => navigate('/admin')}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-deepNavy/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-deepNavy flex items-center justify-center text-white shadow-lg shadow-deepNavy/20 group-hover:scale-110 transition-transform duration-300">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-deepNavy group-hover:text-primaryPink transition-colors">Admin Dashboard</h2>
                                <p className="text-sm text-slate-500">View stats & activity</p>
                            </div>
                        </div>

                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primaryPink group-hover:text-white transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </div>
                    </section>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full py-4 text-red-400 font-medium hover:text-red-500 flex items-center justify-center gap-2"
                >
                    <LogOut size={18} />
                    Log Out
                </button>

                <div className="h-8" /> {/* Spacing */}
            </main>

            {/* Save Button (Regular Inline Button instead of FAB) */}
            <div className="px-6 mb-12">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
                    {t('save_changes')}
                </button>
            </div>
        </div>
    );
};

export default ProfilePage;
