package com.wishu.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Handle cold-start share intent (app was closed when share was triggered)
        handleShareIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        // Handle warm-start share intent (app was already running)
        handleShareIntent(intent)
    }

    /**
     * Converts an Android ACTION_SEND intent (from Chrome / any browser share sheet)
     * into a wishu:// deep link and fires it through Capacitor's bridge.
     *
     * The web layer picks this up via the App.addListener('appUrlOpen', ...) call
     * in src/hooks/useDeepLink.ts, which navigates to /share-target?url=...
     * and ultimately opens AddGift with the URL pre-filled.
     */
    private fun handleShareIntent(intent: Intent?) {
        if (intent?.action != Intent.ACTION_SEND) return
        if (intent.type != "text/plain") return

        val sharedText  = intent.getStringExtra(Intent.EXTRA_TEXT)  ?: return
        val sharedTitle = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: ""

        // Extract URL from shared text (Chrome shares the URL as plain text)
        val urlRegex = Regex("""https?://[^\s]+""")
        val url = urlRegex.find(sharedText)?.value ?: run {
            // Fallback: treat the entire text as the URL if it looks like one
            if (sharedText.startsWith("http")) sharedText else return
        }

        val encodedUrl   = Uri.encode(url)
        val encodedTitle = Uri.encode(sharedTitle)
        val deepLink     = Uri.parse("wishu://share-target?url=$encodedUrl&title=$encodedTitle")

        // Post to the web layer via Capacitor bridge
        bridge?.webView?.post {
            bridge?.app?.fireAppUrlOpen(deepLink)
        }
    }
}
