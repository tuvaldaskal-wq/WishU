/**
 * MainActivity additions for WishU share intent handling.
 *
 * After running `npx cap add android`, open android/app/src/main/java/.../MainActivity.kt
 * and merge the code below into the existing class.
 *
 * This handles the case where Android starts a COLD app start from a share intent
 * (the warm-start case is handled by Capacitor's App plugin automatically).
 */

// Add these imports at the top of MainActivity.kt:
// import android.content.Intent
// import android.net.Uri

class MainActivity : BridgeActivity() {

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleShareIntent(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Handle cold-start share intent
        handleShareIntent(intent)
    }

    private fun handleShareIntent(intent: Intent?) {
        if (intent?.action != Intent.ACTION_SEND) return
        if (intent.type != "text/plain") return

        val sharedText = intent.getStringExtra(Intent.EXTRA_TEXT) ?: return
        val sharedTitle = intent.getStringExtra(Intent.EXTRA_SUBJECT) ?: ""

        // Extract URL from the shared text
        val urlRegex = Regex("""https?://[^\s]+""")
        val url = urlRegex.find(sharedText)?.value ?: sharedText

        if (url.isBlank()) return

        // Build the deep link URL and fire it through Capacitor's bridge
        // This triggers the appUrlOpen listener in useDeepLink.ts
        val encodedUrl   = Uri.encode(url)
        val encodedTitle = Uri.encode(sharedTitle)
        val deepLink = Uri.parse("wishu://share-target?url=$encodedUrl&title=$encodedTitle")

        // Deliver to the web layer via Capacitor
        bridge?.webView?.post {
            bridge?.app?.fireAppUrlOpen(deepLink)
        }
    }
}
