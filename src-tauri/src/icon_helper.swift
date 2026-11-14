import AppKit
import Foundation

let args = CommandLine.arguments
guard args.count >= 3 else {
    fputs("Usage: zerotrash-icon <target-path> <output-png-path>\n", stderr)
    exit(1)
}

let targetPath = args[1]
let outputPath = args[2]

let icon = NSWorkspace.shared.icon(forFile: targetPath)
let targetSize = NSSize(width: 96, height: 96)
icon.size = targetSize

guard let bitmapRep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: 192,
    pixelsHigh: 192,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
) else {
    exit(1)
}

bitmapRep.size = targetSize
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmapRep)
icon.draw(
    in: NSRect(origin: .zero, size: targetSize),
    from: .zero,
    operation: .copy,
    fraction: 1.0
)
NSGraphicsContext.restoreGraphicsState()

guard let pngData = bitmapRep.representation(using: .png, properties: [:]) else {
    exit(1)
}

do {
    try pngData.write(to: URL(fileURLWithPath: outputPath))
} catch {
    exit(1)
}
