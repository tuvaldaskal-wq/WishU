import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gift, PartyPopper } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const GreetingView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [greeting, setGreeting] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGreeting = async () => {
            if (!id) return;
            try {
                const docRef = doc(db, 'greetings', id);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setGreeting(snap.data());
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGreeting();
    }, [id]);

    if (loading) return <div className="min-h-screen bg-lightbg flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    if (!greeting) return <div className="min-h-screen bg-lightbg flex items-center justify-center">Greeting not found.</div>;

    const { theme, message, senderName, videoUrl } = greeting;

    return (
        <div className="min-h-screen bg-lightbg flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {theme === 'party' && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 pointer-events-none" />}

            <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
                {/* Card Header */}
                <div className={`p-8 text-center text-white relative overflow-hidden
                    ${theme === 'party' ? 'bg-gradient-to-br from-indigo-400 to-cyan-400' :
                        theme === 'heart' ? 'bg-gradient-to-br from-rose-400 to-red-400' :
                            theme === 'funny' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                                'bg-slate-100 text-slate-800'
                    }
                 `}>
                    {theme === 'party' && <PartyPopper className="absolute top-4 right-4 opacity-50 w-8 h-8" />}
                    {theme === 'heart' && <Gift className="absolute top-4 right-4 opacity-50 w-8 h-8" />}

                    <h1 className="text-3xl font-bold mb-2 font-handwriting">
                        {senderName} sent you a wish!
                    </h1>
                </div>

                {/* Video Player */}
                {videoUrl && (
                    <div className="aspect-video bg-black relative group">
                        <video
                            src={videoUrl}
                            className="w-full h-full object-cover"
                            controls
                            autoPlay // optional policy
                        />
                    </div>
                )}

                {/* Message */}
                <div className="p-8 text-center">
                    <p className="text-xl font-medium text-slate-700 leading-relaxed font-handwriting">
                        "{message}"
                    </p>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-primary font-bold text-sm hover:underline"
                    >
                        Send a return wish on WishU
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GreetingView;
