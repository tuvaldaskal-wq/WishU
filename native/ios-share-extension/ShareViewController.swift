import UIKit
import Social
import MobileCoreServices
import UniformTypeIdentifiers

/**
 * ShareViewController
 *
 * iOS Share Extension entry point.
 * Receives data from SharePreprocessor.js (which ran on the live product page DOM),
 * then opens WishU via deep link URL scheme.
 *
 * Setup steps in Xcode (after `npx cap add ios`):
 * 1. File → New → Target → Share Extension
 * 2. Name it "ShareExtension"
 * 3. Replace the generated ShareViewController.swift with this file
 * 4. Add SharePreprocessor.js to the target (copy Info.plist entry below)
 * 5. Add App Group capability to BOTH targets:
 *    group.com.wishu.app
 * 6. In Build Settings → Other Linker Flags: nothing extra needed
 */
class ShareViewController: UIViewController {

    private let appGroupId = "group.com.wishu.app"
    private let urlScheme   = "wishu"

    override func viewDidLoad() {
        super.viewDidLoad()
        // Keep UI invisible — we redirect immediately
        view.isHidden = true
        extractAndRedirect()
    }

    private func extractAndRedirect() {
        guard let item = extensionContext?.inputItems.first as? NSExtensionItem,
              let attachments = item.attachments else {
            cancel()
            return
        }

        // The JavaScript preprocessor result is delivered as a property list
        let jsType = UTType.propertyList.identifier

        for provider in attachments {
            if provider.hasItemConformingToTypeIdentifier(jsType) {
                provider.loadItem(forTypeIdentifier: jsType, options: nil) { [weak self] (result, error) in
                    guard let self = self else { return }

                    if let dict = result as? [String: Any] {
                        let url   = dict["url"]   as? String ?? ""
                        let title = dict["title"] as? String ?? ""
                        let price = dict["price"] as? String ?? ""
                        let image = dict["image"] as? String ?? ""

                        DispatchQueue.main.async {
                            self.openWishU(url: url, title: title, price: price, image: image)
                        }
                    } else {
                        DispatchQueue.main.async { self.cancel() }
                    }
                }
                return
            }
        }

        // Fallback: no JS result — try to get plain URL from attachments
        for provider in attachments {
            let urlType = UTType.url.identifier
            if provider.hasItemConformingToTypeIdentifier(urlType) {
                provider.loadItem(forTypeIdentifier: urlType, options: nil) { [weak self] (result, error) in
                    guard let self = self else { return }
                    let urlString = (result as? URL)?.absoluteString ?? ""
                    DispatchQueue.main.async {
                        self.openWishU(url: urlString, title: "", price: "", image: "")
                    }
                }
                return
            }
        }

        cancel()
    }

    private func openWishU(url: String, title: String, price: String, image: String) {
        // Build deep link: wishu://share-target?url=...&title=...&price=...&image=...
        var components = URLComponents()
        components.scheme = urlScheme
        components.host = "share-target"
        components.queryItems = [
            URLQueryItem(name: "url",   value: url),
            URLQueryItem(name: "title", value: title),
            URLQueryItem(name: "price", value: price),
            URLQueryItem(name: "image", value: image),
        ].filter { !($0.value?.isEmpty ?? true) }

        guard let deepLink = components.url else { cancel(); return }

        // Open the main app
        // Extensions can't call UIApplication.shared.open directly,
        // so we use the responder chain trick.
        var responder: UIResponder? = self
        while responder != nil {
            if let app = responder as? UIApplication {
                app.open(deepLink, options: [:], completionHandler: nil)
                break
            }
            responder = responder?.next
        }

        extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }

    private func cancel() {
        extensionContext?.cancelRequest(withError: NSError(
            domain: "com.wishu.share",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "Could not extract product data"]
        ))
    }
}
