import { createContext, useContext, useState, ReactNode } from 'react';

interface HeaderState {
    title?: string;
    subtitle?: string;
    showBackButton?: boolean;
    showSearch?: boolean; // Default true
    customBottomBar?: ReactNode; // Replaces SearchBar if provided
}

interface HeaderContextType {
    headerState: HeaderState;
    setHeaderState: (state: HeaderState) => void;
    resetHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider = ({ children }: { children: ReactNode }) => {
    const [headerState, setHeaderState] = useState<HeaderState>({
        showSearch: true,
        showBackButton: false
    });

    const resetHeader = () => {
        setHeaderState({
            showSearch: true,
            showBackButton: false,
            title: undefined,
            subtitle: undefined,
            customBottomBar: undefined
        });
    };

    return (
        <HeaderContext.Provider value={{ headerState, setHeaderState, resetHeader }}>
            {children}
        </HeaderContext.Provider>
    );
};

export const useHeader = () => {
    const context = useContext(HeaderContext);
    if (!context) {
        throw new Error("useHeader must be used within a HeaderProvider");
    }
    return context;
};
