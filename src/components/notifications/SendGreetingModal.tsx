import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PartyPopper, Gift, Sparkles, Share2, Loader2, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { VideoRecorder } from '../media/VideoRecorder';

interface SendGreetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipient: {
        uid: string;
        name: string;
        photoURL?: string;
    };
    eventType: 'birthday' | 'other';
}

export const SendGreetingModal = ({ isOpen, onClose, recipient, eventType }: SendGreetingModalProps) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Greeting Modal State
    const [theme, setTheme] = useState<'party' | 'minimal' | 'heart' | 'funny'>('party');
    const [message, setMessage] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showRecorder, setShowRecorder] = useState(false);
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleGenerateAI = async () => {
        setAiLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            const name = recipient.name || 'Friend';

            let generatedMsg = "";
            if (theme === 'party') generatedMsg = `Happy ${eventType === 'birthday' ? 'Birthday' : 'Day'} ${name}! 🎂 Ready to party?!`;
            if (theme === 'minimal') generatedMsg = `Best wishes, ${name}.`;
            if (theme === 'heart') generatedMsg = `Sending you lots of love on your special day, ${name}! ❤️`;
            if (theme === 'funny') generatedMsg = `Happy Birthday ${name}! Don't worry, I won't tell anyone how old you really are. 😉`;

            setMessage(generatedMsg);
            showToast("AI Message Generated!", "success");
        } catch (e) {
            showToast("Failed to generate", "error");
        } finally {
            setAiLoading(false);
        }
    };

    const handleShare = async () => {
        if (!user) return;
        setUploading(true);

        try {
            let videoUrl = '';
            if (videoBlob) {
                const storageRef = ref(storage, `greetings/${user.uid}_${Date.now()}.webm`);
                await uploadBytes(storageRef, videoBlob);
                videoUrl = await getDownloadURL(storageRef);
            }

            // Create Greeting Doc
            const greetingData = {
                fromId: user.uid,
                toId: recipient.uid,
                friendName: recipient.name,
                senderName: user.displayName || 'Friend',
                type: eventType,
                theme,
                message,
                videoUrl,
                createdAt: serverTimestamp(),
                read: false
            };

            const docRef = await addDoc(collection(db, 'greetings'), greetingData);

            // Create Notification for the recipient
            await addDoc(collection(db, 'notifications'), {
                userId: recipient.uid,
                type: 'greeting',
                title: `Greeting received from ${user.displayName || 'a friend'}`,
                message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
                data: {
                    greetingId: docRef.id,
                    senderName: user.displayName || 'a friend'
                },
                read: false,
                createdAt: serverTimestamp()
            });

            // Share Link
            const shareUrl = `${window.location.origin}/greeting/${docRef.id}`;
            const shareText = message || `Happy ${eventType === 'birthday' ? 'Birthday' : 'Day'} ${recipient.name}!`;

            const shareData = {
                title: `Greeting for ${recipient.name}`,
                text: `${shareText}\n\nI made a special card for you:`,
                url: shareUrl
            };

            // Use Web Share API if available
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (shareError) {
                    // Ignore share cancellation
                    console.log('Share was cancelled or failed', shareError);
                    // Use clipboard fallback if share failed/cancelled but user still wants feedback
                    if ((shareError as Error).name !== 'AbortError') {
                        navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                        showToast("Greeting link copied to clipboard!", "success");
                    }
                }
            } else {
                navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                showToast("Greeting link copied to clipboard!", "success");
            }

            // Close modal after successful operations
            onClose();
            setMessage('');
            setVideoBlob(null);
            setShowRecorder(false);

        } catch (error) {
            console.error(error);
            showToast("Failed to send greeting", "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-darkbg/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 50 }}
                        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 z-10">
                            <X size={18} />
                        </button>

                        <h2 className="text-xl font-bold text-darkbg mb-1">Send Greeting</h2>
                        <p className="text-slate-400 text-xs mb-4">To {recipient.name}</p>

                        {/* Theme Selection */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                            {['party', 'minimal', 'heart', 'funny'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t as any)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${theme === t ? 'bg-primary text-white border-primary' : 'bg-white text-slate-500 border-slate-200'}`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Card Preview */}
                        <div className={`aspect-video rounded-xl mb-4 flex items-center justify-center p-6 text-center text-white shadow-inner relative overflow-hidden transition-all duration-300
                            ${theme === 'party' ? 'bg-gradient-to-br from-indigo-400 to-cyan-400' :
                                theme === 'heart' ? 'bg-gradient-to-br from-rose-400 to-red-400' :
                                    theme === 'funny' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                                        'bg-slate-100 text-slate-800' /* minimal */
                            }
                        `}>
                            {theme === 'party' && <PartyPopper className="absolute top-2 right-2 opacity-50" />}
                            {theme === 'heart' && <Gift className="absolute top-2 right-2 opacity-50" />}

                            <p className={`font-medium ${theme === 'minimal' ? 'font-sans' : 'font-handwriting text-lg shadow-sm'}`}>
                                {message || (theme === 'funny' ? "Getting old?" : "Best Wishes!")}
                            </p>
                        </div>

                        {/* Message Input */}
                        <div className="relative mb-4">
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your personal wish..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                            />
                            <button
                                onClick={handleGenerateAI}
                                disabled={aiLoading}
                                className="absolute bottom-2 right-2 text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg text-primary flex items-center gap-1 shadow-sm hover:bg-slate-50"
                            >
                                {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                AI Magic
                            </button>
                        </div>

                        {/* Video Section */}
                        <div className="mb-4">
                            {videoBlob ? (
                                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                                    <video src={URL.createObjectURL(videoBlob)} className="w-full h-full object-cover" controls />
                                    <button
                                        onClick={() => setVideoBlob(null)}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowRecorder(true)}
                                    className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
                                >
                                    <Video size={18} />
                                    Record Video Message
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleShare}
                            disabled={uploading}
                            className="w-full bg-darkbg text-white font-bold py-3 rounded-xl shadow-lg shadow-darkbg/20 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {uploading ? <Loader2 className="animate-spin" /> : <Share2 size={18} />}
                            {uploading ? 'Uploading...' : 'Send Greeting'}
                        </button>
                    </motion.div>
                </motion.div>
            )}

            {/* Video Recorder Modal */}
            <AnimatePresence>
                {showRecorder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black z-[70] flex items-center justify-center"
                    >
                        <VideoRecorder
                            onRecordingComplete={(blob) => {
                                setVideoBlob(blob);
                                setShowRecorder(false);
                            }}
                            onCancel={() => setShowRecorder(false)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};
