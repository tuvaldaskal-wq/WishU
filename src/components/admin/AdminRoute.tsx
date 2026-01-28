import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
    children: ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
    const { user, loading, userProfile } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 text-slate-400">
                <Loader2 className="animate-spin" />
            </div>
        );
    }

    if (!user || !userProfile?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
