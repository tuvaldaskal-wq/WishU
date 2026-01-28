import { Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LandingPage from './pages/LandingPage'
import MyWall from './pages/MyWall'
import FriendsPage from './pages/FriendsPage'
import FriendWall from './pages/FriendWall'
import CalendarPage from './pages/CalendarPage'
import ProfilePage from './pages/ProfilePage'
import GiftDetailPage from './pages/GiftDetailPage'
import { useAuth } from './context/AuthContext'
import { Top5Page } from './pages/Top5Page'
import ShareTargetPage from './pages/ShareTargetPage'
import GreetingView from './pages/GreetingView'
import InstallPrompt from './components/pwa/InstallPrompt'
import { ToastProvider } from './context/ToastContext'
import { NotificationProvider } from './context/NotificationContext'
import './index.css'
import './i18n'
import InviteHandler from './pages/InviteHandler'
import { InviteListener } from './components/InviteListener'
import { MainLayout } from './components/layout/MainLayout'
import AdminDashboard from './pages/AdminDashboard'
import PurchasedGiftsPage from './pages/admin/PurchasedGiftsPage'
import { AdminRoute } from './components/admin/AdminRoute'

function App() {
    const { user, loading } = useAuth();
    const { i18n } = useTranslation();

    useEffect(() => {
        document.dir = i18n.dir();
        document.documentElement.lang = i18n.language;
        document.documentElement.setAttribute('dir', i18n.dir());
    }, [i18n.language]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-darkbg text-primary">
                Loading...
            </div>
        );
    }

    return (
        <ToastProvider>
            <NotificationProvider>
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-screen bg-darkbg text-primary">
                        Loading...
                    </div>
                }>
                    <Routes>
                        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />

                        <Route path="/admin" element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        } />

                        <Route path="/admin/purchased" element={
                            <AdminRoute>
                                <PurchasedGiftsPage />
                            </AdminRoute>
                        } />

                        {/* Main Tab Routes */}
                        <Route element={<MainLayout />}>
                            <Route path="/dashboard" element={user ? <MyWall /> : <Navigate to="/" />} />
                            <Route path="/friends" element={user ? <FriendsPage /> : <Navigate to="/" />} />
                            <Route path="/friend/:id" element={user ? <FriendWall /> : <Navigate to="/" />} />
                            <Route path="/calendar" element={user ? <CalendarPage /> : <Navigate to="/" />} />
                            <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" />} />

                            <Route path="/top5" element={user ? <Top5Page /> : <Navigate to="/" />} />
                            <Route path="/gift/:id" element={user ? <GiftDetailPage /> : <Navigate to="/" />} />
                            <Route path="/share-target" element={<ShareTargetPage />} />
                        </Route>

                        <Route path="/greeting/:id" element={<GreetingView />} />
                        <Route path="/invite" element={<InviteHandler />} />

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                    <InviteListener />
                    <InstallPrompt />
                </Suspense>
            </NotificationProvider>
        </ToastProvider>
    )
}

export default App
