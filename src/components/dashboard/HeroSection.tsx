import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, PartyPopper } from 'lucide-react';

interface ImportantDate {
    title: string;
    date: string;
}

interface HeroSectionProps {
    dates: ImportantDate[];
    partnerName: string;
    message?: string;
}

export const HeroSection = ({ dates, partnerName, message }: HeroSectionProps) => {
    const { t } = useTranslation();
    const [nearestEvent, setNearestEvent] = useState<ImportantDate | null>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number } | null>(null);

    useEffect(() => {
        if (!dates || dates.length === 0) return;

        // Find nearest future date
        const now = new Date();
        const futureDates = dates.map(d => {
            const eventDate = new Date(d.date);
            // If date is passed this year, look at next year
            const currentYearDate = new Date(now.getFullYear(), eventDate.getMonth(), eventDate.getDate());
            if (currentYearDate < now && currentYearDate.getDate() !== now.getDate()) {
                currentYearDate.setFullYear(now.getFullYear() + 1);
            }
            return {
                ...d,
                targetDate: currentYearDate
            };
        }).sort((a, _b) => a.targetDate.getTime() - now.getTime());

        if (futureDates.length > 0) {
            setNearestEvent(futureDates[0]);
        }
    }, [dates]);

    useEffect(() => {
        if (!nearestEvent) return;

        const calculateTime = () => {
            // Re-calculate target date here to be safe
            // We need to construct the target date object again properly
            const now = new Date();
            const eventDate = new Date(nearestEvent.date);
            let target = new Date(now.getFullYear(), eventDate.getMonth(), eventDate.getDate());

            // Check if today is the day!
            if (target.getDate() === now.getDate() && target.getMonth() === now.getMonth()) {
                setTimeLeft({ days: 0, hours: 0 }); // It's today
                return;
            }

            if (target < now) {
                target.setFullYear(now.getFullYear() + 1);
            }

            const diff = target.getTime() - now.getTime();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            setTimeLeft({ days, hours });
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000 * 60); // Update every minute

        return () => clearInterval(timer);
    }, [nearestEvent]);

    // If no events, show a generic welcome hero
    if (!nearestEvent || !timeLeft) {
        return (
            <div className="relative overflow-hidden rounded-3xl bg-darkbg text-white shadow-xl mb-8 p-8">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                        <PartyPopper className="text-primary" size={16} />
                        {t('welcome_back')} {partnerName}
                    </h2>
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 mb-2">
                        {message || t('no_upcoming_events')}
                    </h1>
                    <p className="text-slate-400 text-sm max-w-sm mt-2">
                        Check out the wishlist below to find the perfect gift! 🎁
                    </p>
                </div>
            </div>
        );
    }

    const isToday = timeLeft.days === 0 && timeLeft.hours === 0;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-darkbg text-white shadow-xl mb-8 p-8">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                <div>
                    <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                        {isToday ? <PartyPopper className="text-primary" size={16} /> : <Calendar className="text-primary" size={16} />}
                        {isToday ? t('event_today') : `${t('upcoming_event') || 'Upcoming Event'}`}
                    </h2>
                    <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300 mb-2">
                        {nearestEvent.title}
                    </h1>
                    {message && (
                        <p className="text-slate-400 italic text-sm max-w-sm mt-2 border-l-2 border-primary/30 pl-3">
                            "{message}"
                        </p>
                    )}
                </div>

                {/* Countdown */}
                <div className="flex gap-4">
                    <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-24 h-24">
                        <span className="text-3xl font-bold font-mono">{timeLeft.days}</span>
                        <span className="text-xs text-slate-400 font-medium uppercase">{t('days_left')}</span>
                    </div>
                    {!isToday && (
                        <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-24 h-24">
                            <span className="text-3xl font-bold font-mono">{timeLeft.hours}</span>
                            <span className="text-xs text-slate-400 font-medium uppercase">{t('hours_left')}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
