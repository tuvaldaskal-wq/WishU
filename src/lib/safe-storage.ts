
// This file provides a wrapper around localStorage/sessionStorage to prevent crashes
// in private mode (iOS) or restricted environments where accessing storage throws an error.

class SafeStorage {
    private type: 'localStorage' | 'sessionStorage';
    private memoryFallback: Record<string, string> = {};
    private isBroken = false;

    constructor(type: 'localStorage' | 'sessionStorage') {
        this.type = type;
        try {
            // Test if storage is effectively available
            const testKey = '__storage_test__';
            window[type].setItem(testKey, testKey);
            window[type].removeItem(testKey);
        } catch (e) {
            console.warn(`[SafeStorage] ${type} is not available (likely Private Mode). Using memory fallback.`);
            this.isBroken = true;
        }
    }

    getItem(key: string): string | null {
        if (this.isBroken) return this.memoryFallback[key] || null;
        try {
            return window[this.type].getItem(key);
        } catch (e) {
            // If random read fails, fall back to memory for this read (rare)
            return this.memoryFallback[key] || null;
        }
    }

    setItem(key: string, value: string): void {
        const strValue = String(value);
        if (this.isBroken) {
            this.memoryFallback[key] = strValue;
            return;
        }

        try {
            window[this.type].setItem(key, strValue);
        } catch (e) {
            // E.g. QuotaExceededError or SecurityError
            console.warn(`[SafeStorage] setItem failed for ${key}, falling back to memory.`);
            this.memoryFallback[key] = strValue;
        }
    }

    removeItem(key: string): void {
        if (this.isBroken) {
            delete this.memoryFallback[key];
            return;
        }
        try {
            window[this.type].removeItem(key);
        } catch (e) {
            delete this.memoryFallback[key];
        }
    }

    clear(): void {
        if (this.isBroken) {
            this.memoryFallback = {};
            return;
        }
        try {
            window[this.type].clear();
        } catch (e) {
            this.memoryFallback = {};
        }
    }
}

export const safeLocalStorage = new SafeStorage('localStorage');
export const safeSessionStorage = new SafeStorage('sessionStorage');
