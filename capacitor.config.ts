import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.wishu.app',
    appName: 'WishU',
    webDir: 'dist',
    server: {
        // Remove this block before building for production.
        // Used only for live-reload during development.
        // androidScheme: 'https',
    },
    plugins: {
        // No extra plugin config needed — deep links handled via URL scheme below.
    },
    ios: {
        // URL scheme: wishu://
        // Universal Links domain (add when you have one): wishu.app
        contentInset: 'automatic',
        backgroundColor: '#ffffff',
        // App Group used to share data between the Share Extension and the main app.
        // Must match the group ID you configure in Xcode → Signing & Capabilities.
        // Format: group.<appId>
    },
    android: {
        backgroundColor: '#ffffff',
        // Android intent filter is configured in android/app/src/main/AndroidManifest.xml
        // after running: npx cap add android
    },
};

export default config;
