
// This file monkey-patches the global storage objects to prevent crashes in private mode (iOS)
// or restricted environments where accessing localStorage/sessionStorage throws an error.

try {
    const isSupported = (type: 'localStorage' | 'sessionStorage') => {
        try {
            const storage = window[type];
            const x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return false;
        }
    };

    if (!isSupported('localStorage')) {
        console.warn('localStorage not supported, using memory fallback');
        const memoryStorage: Record<string, string> = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: (key: string) => memoryStorage[key] || null,
                setItem: (key: string, value: string) => { memoryStorage[key] = String(value); },
                removeItem: (key: string) => { delete memoryStorage[key]; },
                clear: () => { for (const k in memoryStorage) delete memoryStorage[k]; },
                length: 0,
                key: (index: number) => Object.keys(memoryStorage)[index] || null,
            },
            writable: true
        });
    }

    if (!isSupported('sessionStorage')) {
        console.warn('sessionStorage not supported, using memory fallback');
        const memoryStorage: Record<string, string> = {};
        Object.defineProperty(window, 'sessionStorage', {
            value: {
                getItem: (key: string) => memoryStorage[key] || null,
                setItem: (key: string, value: string) => { memoryStorage[key] = String(value); },
                removeItem: (key: string) => { delete memoryStorage[key]; },
                clear: () => { for (const k in memoryStorage) delete memoryStorage[k]; },
                length: 0,
                key: (index: number) => Object.keys(memoryStorage)[index] || null,
            },
            writable: true
        });
    }

} catch (e) {
    console.error('Failed to initialize safe storage', e);
}
