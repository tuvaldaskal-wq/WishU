import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../BottomNav';
import { AnimatePresence } from 'framer-motion';
import { AddGift } from '../gifts/AddGift';
import { ModalProvider, useModal } from '../../context/ModalContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { EditGiftModal } from '../gifts/EditGiftModal';
import { GreetingModal } from '../notifications/GreetingModal';
import { GlobalHeader } from './GlobalHeader';
import { SearchProvider } from '../../context/SearchContext';
import { HeaderProvider } from '../../context/HeaderContext';

interface LocationState {
    openAddGift?: boolean;
    initialUrl?: string;
    initialTitle?: string;
    initialPrice?: string;
    initialImage?: string;
}
export const MainLayout = () => {
    return (
        <SearchProvider>
            <ModalProvider>
                <NotificationProvider>
                    <HeaderProvider>
                        <MainLayoutContent />
                    </HeaderProvider>
                </NotificationProvider>
            </ModalProvider>
        </SearchProvider>
    );
};

const MainLayoutContent = () => {
    const [showAddGift, setShowAddGift] = useState(false);
    const [sharedUrl, setSharedUrl] = useState('');
    const [sharedPrice, setSharedPrice] = useState('');
    const [sharedImage, setSharedImage] = useState('');
    const [openGreetingId, setOpenGreetingId] = useState<string | null>(null);
    const { editingGift, setEditingGift } = useModal();
    const location = useLocation();
    const navigate = useNavigate();

    // Listen for navigation state from ShareTargetPage
    useEffect(() => {
        const state = location.state as LocationState | null;
        if (state?.openAddGift && state?.initialUrl) {
            console.log('MainLayout: Opening AddGift with shared URL:', state.initialUrl);
            setSharedUrl(state.initialUrl);
            if (state.initialPrice) setSharedPrice(state.initialPrice);
            if (state.initialImage) setSharedImage(state.initialImage);
            setShowAddGift(true);
            // Clear the state to prevent re-triggering on refresh
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, navigate]);

    const handleCloseAddGift = () => {
        setShowAddGift(false);
        setSharedUrl('');
        setSharedPrice('');
        setSharedImage('');
    };

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* Persistent Header */}
            <GlobalHeader
                onSearch={(q) => console.log('Search:', q)}
                onOpenGreeting={setOpenGreetingId}
            />

            {/* The Page Content — pb-32 ensures nothing hides behind the fixed bottom nav + FAB */}
            <div className="pb-32">
                <Outlet />
            </div>

            {/* Persistent Navigation */}
            <BottomNav
                onAddClick={() => setShowAddGift(true)}
            />

            {/* Global Add Gift Modal */}
            <AnimatePresence>
                {showAddGift && (
                    <AddGift
                        onClose={handleCloseAddGift}
                        initialUrl={sharedUrl}
                        initialPrice={sharedPrice}
                        initialImage={sharedImage}
                    />
                )}
            </AnimatePresence>

            {/* Global Edit Gift Modal (Fixed Stacking) */}
            <AnimatePresence>
                {editingGift && (
                    <EditGiftModal
                        gift={editingGift}
                        onClose={() => setEditingGift(null)}
                    />
                )}
            </AnimatePresence>

            {/* Global Greeting Modal */}
            <GreetingModal
                greetingId={openGreetingId}
                onClose={() => setOpenGreetingId(null)}
            />
        </div>
    );
};
