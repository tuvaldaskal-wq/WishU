import { Search, ArrowLeft } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { useHeader } from '../../context/HeaderContext';
import { useNavigate } from 'react-router-dom';

interface GlobalHeaderProps {
    onSearch?: (query: string) => void;
    onOpenGreeting?: (greetingId: string) => void;
}

export const GlobalHeader = ({ onSearch, onOpenGreeting = () => { } }: GlobalHeaderProps) => {
    const { searchQuery, setSearchQuery } = useSearch();
    const { headerState } = useHeader();
    const navigate = useNavigate();

    const handleSearchChange = (val: string) => {
        setSearchQuery(val);
        onSearch?.(val);
    };

    return (
        <header className="bg-white px-6 pt-[5px] pb-[10px] sticky top-0 z-50">
            <div className="flex flex-col gap-1">
                {/* Top Row: Back - Logo - Bell */}
                <div className="flex items-center justify-between mb-1">
                    {/* Left: Back Button or Spacer */}
                    <div className="w-10 flex justify-start">
                        {headerState.showBackButton ? (
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 text-primary bg-secondary/20 rounded-full hover:bg-secondary/30 transition-colors"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <div className="w-10" />
                        )}
                    </div>

                    {/* Center: Logo */}
                    <div className="flex-1 flex justify-center">
                        <img
                            src="/wishu_logo.png"
                            alt="WishU"
                            className="w-[160px] h-auto object-contain mix-blend-multiply"
                        />
                    </div>

                    {/* Right: Notification Bell */}
                    <div className="w-10 flex justify-end">
                        <NotificationBell onOpenGreeting={onOpenGreeting} />
                    </div>
                </div>

                {/* Optional Title Row (Below Logo) */}
                {headerState.title && (
                    <div className="text-center mb-2">
                        <h1 className="text-lg font-bold text-darkbg">{headerState.title}</h1>
                        {headerState.subtitle && (
                            <p className="text-xs text-slate-400">{headerState.subtitle}</p>
                        )}
                    </div>
                )}

                {/* Bottom Row: Search Bar OR Custom Content (Filters) */}
                <div className="relative w-full">
                    {headerState.customBottomBar ? (
                        headerState.customBottomBar
                    ) : (
                        // Default Search Bar
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                placeholder=""
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full bg-secondary text-primary font-medium rounded-full py-3.5 pl-12 pr-6 outline-none border-none placeholder-primary/60 focus:ring-2 focus:ring-primary/20 shadow-sm"
                            />
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
