import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';
import { enUS, he } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface DateInputProps {
    label?: string;
    value: string;
    onChange: (e: { target: { value: string } }) => void;
    error?: string;
}

export const DateInput = ({ label, value, onChange, error }: DateInputProps) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';

    const handleChange = (date: Date | null) => {
        if (date) {
            // Format to YYYY-MM-DD to match the existing string interface
            const dateString = date.toISOString().split('T')[0];
            onChange({ target: { value: dateString } });
        }
    };

    return (
        <div className="mb-4 w-full">
            {label && (
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <DatePicker
                    selected={value ? new Date(value) : null}
                    onChange={handleChange}
                    dateFormat="yyyy-MM-dd"
                    locale={isRTL ? he : enUS}
                    className={`w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-darkbg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all shadow-sm ${error ? 'border-red-500 focus:ring-red-200' : ''}`}
                    wrapperClassName="w-full"
                    placeholderText="YYYY-MM-DD"
                    showYearDropdown
                    scrollableYearDropdown
                    yearDropdownItemNumber={100}
                />
                <div className={`absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none ${isRTL ? 'left-4' : 'right-4'}`}>
                    <Calendar size={20} />
                </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-1 ml-1">{error}</p>}
        </div>
    );
};
