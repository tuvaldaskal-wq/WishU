package com.wishy.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.codetrixstudio.capacitor.GoogleAuth.GoogleAuth

class MainActivity : BridgeActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(GoogleAuth::class.java)
        intent = convertShareToDeepLink(intent) ?: intent
        super.onCreate(savedInstanceState)
    }

    override fun onNewIntent(intent: Intent) {
        val processedIntent = convertShareToDeepLink(intent) ?: intent
        super.onNewIntent(processedIntent)
    }

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
