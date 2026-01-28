import { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 font-medium text-sm whitespace-nowrap
                            ${toast.type === 'success' ? 'bg-darkbg text-white' : 'bg-red-500 text-white'}
                        `}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-green-500' : 'bg-white/20'}`}>
                            {toast.type === 'success' ? <Check size={14} /> : <X size={14} />}
                        </div>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    );
};
