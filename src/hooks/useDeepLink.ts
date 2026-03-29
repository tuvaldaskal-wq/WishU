import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * useDeepLink
 *
 * Listens for Capacitor app URL open events (fired when the native app is opened
 * via a custom URL scheme or Universal Link) and navigates to the appropriate route.
 *
 * URL scheme format used by the iOS Share Extension and Android intent:
 *   wishu://share-target?url=<encoded_product_url>&title=<title>&price=<price>&image=<image_url>
 *
 * This hook is a no-op when running in the browser (non-native environment).
 */
export const useDeepLink = () => {
    const navigate = useNavigate();

    useEffect(() => {
        let cleanup: (() => void) | undefined;

        const setup = async () => {
            // Dynamically import — tree-shaken away in PWA builds
            const { Capacitor } = await import('@capacitor/core');
            if (!Capacitor.isNativePlatform()) return;

            const { App } = await import('@capacitor/app');

            const listener = await App.addListener('appUrlOpen', (event) => {
                const url = event.url;
                console.log('[DeepLink] App opened with URL:', url);

                try {
                    // Parse wishu://share-target?url=...&title=...&price=...&image=...
                    // URL class doesn't support custom schemes on all platforms,
                    // so we extract the query string manually.
                    const queryStart = url.indexOf('?');
                    if (queryStart === -1) {
                        navigate('/dashboard', { replace: true });
                        return;
                    }

                    const queryString = url.slice(queryStart + 1);
                    const params = new URLSearchParams(queryString);

                    const path = url.slice(0, queryStart).replace(/^[a-z]+:\/\/[^/]*/, '');
                    // path = '/share-target' → navigate there with params
                    const destination = path || '/share-target';

                    navigate(`${destination}?${params.toString()}`, { replace: true });
                } catch (err) {
                    console.error('[DeepLink] Failed to parse URL:', err);
                    navigate('/dashboard', { replace: true });
                }
            });

            // Also handle the case where the app was cold-started from a URL
            // (getLaunchUrl fires once after the App plugin is ready)
            const launchUrl = await App.getLaunchUrl();
            if (launchUrl?.url) {
                const url = launchUrl.url;
                const queryStart = url.indexOf('?');
                if (queryStart !== -1) {
                    const queryString = url.slice(queryStart + 1);
                    const params = new URLSearchParams(queryString);
                    const path = url.slice(0, queryStart).replace(/^[a-z]+:\/\/[^/]*/, '');
                    navigate(`${path || '/share-target'}?${params.toString()}`, { replace: true });
                }
            }

            cleanup = () => {
                listener.remove();
            };
        };

        setup();
        return () => cleanup?.();
    }, [navigate]);
};
