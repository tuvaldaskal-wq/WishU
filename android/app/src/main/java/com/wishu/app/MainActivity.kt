package com.wishu.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        // Convert a cold-start share intent BEFORE super.onCreate so the bridge
        // sees a clean ACTION_VIEW deep-link intent from the very first frame.
        intent = convertShareToDeepLink(intent) ?: intent
        super.onCreate(savedInstanceState)
    }

    override fun onNewIntent(intent: Intent) {
        // Convert a warm-start share intent, then let the bridge handle the
        // resulting ACTION_VIEW intent — the App plugin fires 'appUrlOpen' for us.
        val processedIntent = convertShareToDeepLink(intent) ?: intent
        super.onNewIntent(processedIntent)
    }

    /**
     * If the given intent is an ACTION_SEND text/plain share, converts it into
     * an ACTION_VIEW intent pointing at wishu://share-target?url=...&title=...
     *
     * Capacitor's App plugin handles ACTION_VIEW intents natively and fires the
     * 'appUrlOpen' event that src/hooks/useDeepLink.ts listens for.
     *
     * Returns null if the intent is not a share or has no extractable URL.
     */
    private fun convertShareToDeepLink(intent: Intent?): Intent? {
        if (intent?.action != Intent.ACTION_SEND) return null
        if (intent.type != "text/plain") return null

        val sharedText  = intent.getStringExtra(Intent.EXTRA_TEXT)  ?: return null
        val sharedTitle = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: ""

        val urlRegex = Regex("""https?://[^\s]+""")
        val url = urlRegex.find(sharedText)?.value
            ?: if (sharedText.startsWith("http")) sharedText else return null

        val encodedUrl   = Uri.encode(url)
        val encodedTitle = Uri.encode(sharedTitle)
        val deepLink     = Uri.parse("wishu://share-target?url=$encodedUrl&title=$encodedTitle")

        return Intent(Intent.ACTION_VIEW, deepLink)
    }
}
