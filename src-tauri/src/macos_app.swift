import AppKit
import WebKit
import Foundation

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var statusItem: NSStatusItem!
    var serverProcess: Process?
    var pendingDroppedFile: String?
    let projectDir = "/Users/spiros/Desktop/zerotrash"
    let serverURL = URL(string: "http://127.0.0.1:1420")!

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupMainMenu()
        setupStatusBarItem()
        createMainWindow()
        ensureServerAndLoad()
    }

    func setupMainMenu() {
        let mainMenu = NSMenu()
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)

        let appMenu = NSMenu()
        appMenu.addItem(
            withTitle: "Check for Updates...",
            action: #selector(openUpdatesModal),
            keyEquivalent: "u"
        )
        appMenu.addItem(
            withTitle: "Report a Bug...",
            action: #selector(openBugReportModal),
            keyEquivalent: "b"
        )
        appMenu.addItem(
            withTitle: "Reload ZeroTrash",
            action: #selector(reloadWebView),
            keyEquivalent: "r"
        )
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(
            withTitle: "Hide ZeroTrash",
            action: #selector(NSApplication.hide(_:)),
            keyEquivalent: "h"
        )
        appMenu.addItem(
            withTitle: "Quit ZeroTrash",
            action: #selector(NSApplication.terminate(_:)),
            keyEquivalent: "q"
        )
        appMenuItem.submenu = appMenu
        NSApp.mainMenu = mainMenu
    }

    func makeMenuBarTemplateIcon() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let img = NSImage(size: size, flipped: false) { rect in
            let s = rect.width
            let center = NSPoint(x: s * 0.5, y: s * 0.5)

            // 1. 270-degree outer sweep ring (from -35 deg to 225 deg)
            let ringRadius = s * 0.41
            let ringPath = NSBezierPath()
            ringPath.appendArc(withCenter: center, radius: ringRadius, startAngle: -35, endAngle: 225, clockwise: false)
            ringPath.lineWidth = 1.65
            ringPath.lineCapStyle = .round
            NSColor.black.setStroke()
            ringPath.stroke()

            // 2. Center Trash Bin Body (with 2 vertical cutouts using evenOdd winding)
            let binW = s * 0.34
            let binTopW = s * 0.38
            let binH = s * 0.36
            let binBottomY = center.y - binH * 0.54
            let binTopY = binBottomY + binH

            let body = NSBezierPath()
            body.move(to: NSPoint(x: center.x - binTopW * 0.5, y: binTopY))
            body.line(to: NSPoint(x: center.x + binTopW * 0.5, y: binTopY))
            body.line(to: NSPoint(x: center.x + binW * 0.5, y: binBottomY))
            body.line(to: NSPoint(x: center.x - binW * 0.5, y: binBottomY))
            body.close()

            let slotW: CGFloat = 1.15
            let slotH = binH * 0.54
            let slotY = binBottomY + (binH - slotH) * 0.5
            for offset in [-binW * 0.18, binW * 0.18] {
                let slotRect = NSRect(x: center.x + offset - slotW * 0.5, y: slotY, width: slotW, height: slotH)
                body.append(NSBezierPath(roundedRect: slotRect, xRadius: 0.5, yRadius: 0.5))
            }
            body.windingRule = .evenOdd
            NSColor.black.setFill()
            body.fill()

            // 3. Floating Lid + Handle above Trash Bin
            let lidW = binTopW * 1.16
            let lidH: CGFloat = 1.45
            let lidY = binTopY + 1.05
            let lidRect = NSRect(x: center.x - lidW * 0.5, y: lidY, width: lidW, height: lidH)
            NSBezierPath(roundedRect: lidRect, xRadius: 0.7, yRadius: 0.7).fill()

            let handleW = lidW * 0.34
            let handleH: CGFloat = 1.0
            let handleRect = NSRect(x: center.x - handleW * 0.5, y: lidY + lidH, width: handleW, height: handleH)
            NSBezierPath(roundedRect: handleRect, xRadius: 0.5, yRadius: 0.5).fill()

            // 4. Verified Checkmark at bottom-right of the ring
            let checkCenter = NSPoint(
                x: center.x + ringRadius * cos(-50.0 * .pi / 180.0),
                y: center.y + ringRadius * sin(-50.0 * .pi / 180.0)
            )
            let check = NSBezierPath()
            check.move(to: NSPoint(x: checkCenter.x - 1.8, y: checkCenter.y + 0.1))
            check.line(to: NSPoint(x: checkCenter.x - 0.4, y: checkCenter.y - 1.3))
            check.line(to: NSPoint(x: checkCenter.x + 2.2, y: checkCenter.y + 1.5))
            check.lineWidth = 1.55
            check.lineCapStyle = .round
            check.lineJoinStyle = .round
            NSColor.black.setStroke()
            check.stroke()

            return true
        }
        img.isTemplate = true
        return img
    }

    func setupStatusBarItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let button = statusItem.button {
            button.image = makeMenuBarTemplateIcon()
            button.imagePosition = .imageOnly
            button.toolTip = "ZeroTrash — System Cleaner & Uninstaller"
        }

        let menu = NSMenu()
        menu.addItem(
            withTitle: "Open ZeroTrash Window",
            action: #selector(showMainWindow),
            keyEquivalent: "o"
        )
        menu.addItem(
            withTitle: "Check for Updates...",
            action: #selector(openUpdatesModal),
            keyEquivalent: "u"
        )
        menu.addItem(
            withTitle: "Report a Bug...",
            action: #selector(openBugReportModal),
            keyEquivalent: "b"
        )
        menu.addItem(
            withTitle: "Refresh Telemetry",
            action: #selector(reloadWebView),
            keyEquivalent: "r"
        )
        menu.addItem(NSMenuItem.separator())
        menu.addItem(
            withTitle: "Quit ZeroTrash",
            action: #selector(NSApplication.terminate(_:)),
            keyEquivalent: "q"
        )
        statusItem.menu = menu
    }

    func createMainWindow() {
        let rect = NSRect(x: 0, y: 0, width: 1360, height: 860)
        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "ZeroTrash — macOS System Cleaner & Uninstaller"
        window.appearance = NSAppearance(named: .darkAqua)
        window.backgroundColor = NSColor(calibratedRed: 0.078, green: 0.078, blue: 0.086, alpha: 1.0)
        window.minSize = NSSize(width: 1024, height: 680)
        window.center()
        window.delegate = self

        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.setValue(false, forKey: "drawsBackground")

        window.contentView?.addSubview(webView)
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func ensureServerAndLoad() {
        checkServerReady { ready in
            if ready {
                DispatchQueue.main.async {
                    self.webView.load(URLRequest(url: self.serverURL))
                }
            } else {
                self.startBackgroundServer()
                self.pollUntilReady(attempts: 30)
            }
        }
    }

    func checkServerReady(completion: @escaping (Bool) -> Void) {
        var req = URLRequest(url: serverURL)
        req.timeoutInterval = 0.6
        URLSession.shared.dataTask(with: req) { _, resp, _ in
            if let http = resp as? HTTPURLResponse, http.statusCode == 200 {
                completion(true)
            } else {
                completion(false)
            }
        }.resume()
    }

    func startBackgroundServer() {
        let bundleMacOS = Bundle.main.bundleURL.appendingPathComponent("Contents/MacOS")
        let bundleResources = Bundle.main.bundleURL.appendingPathComponent("Contents/Resources")
        let bundledCli = bundleMacOS.appendingPathComponent("zerotrash-cli").path
        let bundledIcon = bundleMacOS.appendingPathComponent("zerotrash-icon").path
        let bundledDist = bundleResources.appendingPathComponent("dist").path

        if FileManager.default.fileExists(atPath: bundledCli) &&
           FileManager.default.fileExists(atPath: bundledDist) {
            let proc = Process()
            proc.executableURL = URL(fileURLWithPath: bundledCli)
            proc.arguments = ["serve", "1420", bundledDist, bundledIcon]
            try? proc.run()
            self.serverProcess = proc
            return
        }

        // Fallback to local development server if running unbundled
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/bin/zsh")
        proc.arguments = [
            "-c",
            "export PATH=\"/opt/homebrew/bin:/usr/local/bin:$HOME/.cargo/bin:$PATH\" && cd \"\(projectDir)\" && npm run dev"
        ]
        try? proc.run()
        self.serverProcess = proc
    }

    func pollUntilReady(attempts: Int) {
        guard attempts > 0 else { return }
        DispatchQueue.global().asyncAfter(deadline: .now() + 0.35) {
            self.checkServerReady { ready in
                if ready {
                    DispatchQueue.main.async {
                        self.webView.load(URLRequest(url: self.serverURL))
                        if let dropped = self.pendingDroppedFile {
                            self.pendingDroppedFile = nil
                            DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                                self.forwardDroppedFile(dropped)
                            }
                        }
                    }
                } else {
                    self.pollUntilReady(attempts: attempts - 1)
                }
            }
        }
    }

    func forwardDroppedFile(_ path: String) {
        let escaped = path.replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
        webView?.evaluateJavaScript(
            "window.handleZeroTrashDroppedPath && window.handleZeroTrashDroppedPath(\"\(escaped)\")",
            completionHandler: nil
        )
    }

    func application(_ sender: NSApplication, openFiles filenames: [String]) {
        guard let first = filenames.first else { return }
        showMainWindow()
        if webView != nil && !webView.isLoading {
            forwardDroppedFile(first)
        } else {
            pendingDroppedFile = first
        }
        sender.reply(toOpenOrPrint: .success)
    }

    @objc func openUpdatesModal() {
        showMainWindow()
        webView?.evaluateJavaScript(
            "window.openZeroTrashUpdates && window.openZeroTrashUpdates()",
            completionHandler: nil
        )
    }

    @objc func openBugReportModal() {
        showMainWindow()
        webView?.evaluateJavaScript(
            "window.openZeroTrashBugReport && window.openZeroTrashBugReport()",
            completionHandler: nil
        )
    }

    @objc func showMainWindow() {
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    @objc func reloadWebView() {
        webView.reload()
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag {
            window.makeKeyAndOrderFront(nil)
        }
        return true
    }

    func applicationWillTerminate(_ notification: Notification) {
        if let proc = serverProcess, proc.isRunning {
            proc.terminate()
        }
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.regular)
let delegate = AppDelegate()
app.delegate = delegate
app.run()
