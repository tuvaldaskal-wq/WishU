import { createContext, useContext, useState, ReactNode } from 'react';
import { Gift } from '../components/gifts/GiftCard';

interface ModalContextType {
    editingGift: Gift | null;
    setEditingGift: (gift: Gift | null) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [editingGift, setEditingGift] = useState<Gift | null>(null);

    return (
        <ModalContext.Provider value={{ editingGift, setEditingGift }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
