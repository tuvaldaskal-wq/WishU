import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gift } from 'lucide-react';

const ShareTargetPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [minDelayPassed, setMinDelayPassed] = useState(false);

    // 1. Enforce a minimum stability delay (fixes race conditions on Android cold start)
    useEffect(() => {
        const timer = setTimeout(() => {
            setMinDelayPassed(true);
        }, 1500); // 1.5s delay to stabilize

        return () => clearTimeout(timer);
    }, []);

    // 2. Process logic only when Auth is ready AND Delay passed
    useEffect(() => {
        if (loading || !minDelayPassed) return;

        const urlParam = searchParams.get('url');
        const textParam = searchParams.get('text');
        const titleParam = searchParams.get('title');

        // URL Extraction Logic
        let sharedUrl = urlParam;
        if (!sharedUrl && textParam) {
            const urlMatch = textParam.match(/(https?:\/\/[^\s]+)/g);
            if (urlMatch && urlMatch.length > 0) {
                sharedUrl = urlMatch[0];
            }
        }
        if (!sharedUrl && textParam && textParam.startsWith('http')) {
            sharedUrl = textParam;
        }

        // --- Execute Redirect ---
        if (!sharedUrl) {
            console.warn("ShareTarget: No URL found");
            navigate('/dashboard', { replace: true });
            return;
        }

        if (user) {
            // Logged In -> Dashboard
            navigate('/dashboard', {
                replace: true,
                state: {
                    openAddGift: true,
                    initialUrl: sharedUrl,
                    initialTitle: titleParam || ''
                }
            });
        } else {
            // Logged Out -> Login (save pending)
            localStorage.setItem('pendingShareUrl', sharedUrl);
            if (titleParam) localStorage.setItem('pendingShareTitle', titleParam);
            navigate('/login', { replace: true });
        }

    }, [user, loading, minDelayPassed, searchParams, navigate]);

    return (
        <div className="flex items-center justify-center h-screen bg-lightbg text-darkbg font-sans">
            <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-3xl shadow-xl max-w-sm w-full mx-4 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse">
                    <Gift size={32} />
                </div>
                <div>
                    <h2 className="text-xl font-bold mb-2">Processing Gift...</h2>
                    <p className="text-slate-500 text-sm">Do not close the app.</p>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress-indeterminate"></div>
                </div>
            </div>
        </div>
    );
};

export default ShareTargetPage;
