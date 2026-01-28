import { ReactNode } from 'react';

interface StatsCardProps {
    title: string;
    value: number | string;
    icon: ReactNode;
    color?: string;
    trend?: string;
    trendUp?: boolean;
    onClick?: () => void;
}

export const StatsCard = ({ title, value, icon, trend, trendUp, onClick }: StatsCardProps) => {
    return (
        <div
            onClick={onClick}
            className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 flex flex-col justify-between h-full
            ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]' : 'hover:shadow-md'}
            `}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 rounded-xl text-primaryPink">
                    {icon}
                </div>
                {trend && (
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-bold text-deepNavy">{value}</p>
            </div>
        </div>
    );
};
