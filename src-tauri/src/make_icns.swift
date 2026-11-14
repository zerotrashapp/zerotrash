import AppKit
import Foundation

let outDir = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp/ZeroTrash.iconset"
try? FileManager.default.removeItem(atPath: outDir)
try! FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

func drawIcon(size: Int, filename: String, fullBleed: Bool = false) {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!

    NSGraphicsContext.saveGraphicsState()
    let ctx = NSGraphicsContext(bitmapImageRep: rep)!
    ctx.imageInterpolation = .high
    ctx.shouldAntialias = true
    NSGraphicsContext.current = ctx

    let s = CGFloat(size)
    let pad = fullBleed ? 0.0 : s * 0.088
    let rect = NSRect(x: pad, y: pad, width: s - pad * 2, height: s - pad * 2)
    let radius = fullBleed ? s * 0.22 : rect.width * 0.225

    // 1. Soft macOS Sequoia outer drop shadow (only for squircle icon)
    if !fullBleed {
        NSGraphicsContext.saveGraphicsState()
        let shadow = NSShadow()
        shadow.shadowColor = NSColor(calibratedWhite: 0.0, alpha: 0.42)
        shadow.shadowOffset = NSSize(width: 0, height: -s * 0.022)
        shadow.shadowBlurRadius = s * 0.045
        shadow.set()
        let bgShadowPath = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
        NSColor(calibratedRed: 0.07, green: 0.09, blue: 0.14, alpha: 1.0).setFill()
        bgShadowPath.fill()
        NSGraphicsContext.restoreGraphicsState()
    }

    // 2. Clip to Squircle
    let squircle = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
    NSGraphicsContext.saveGraphicsState()
    squircle.addClip()

    // Background: Deep Apple Midnight Slate -> Rich Navy Gradient
    let bgGrad = NSGradient(colorsAndLocations:
        (NSColor(calibratedRed: 0.13, green: 0.16, blue: 0.22, alpha: 1.0), 0.0),
        (NSColor(calibratedRed: 0.08, green: 0.10, blue: 0.14, alpha: 1.0), 0.55),
        (NSColor(calibratedRed: 0.05, green: 0.06, blue: 0.09, alpha: 1.0), 1.0)
    )!
    bgGrad.draw(in: rect, angle: -90)

    // Subtle radial ambient glow in the center (Apple System Blue)
    let centerPoint = NSPoint(x: s * 0.5, y: s * 0.48)
    let glowGrad = NSGradient(colorsAndLocations:
        (NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.28), 0.0),
        (NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.08), 0.5),
        (NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.0), 1.0)
    )!
    glowGrad.draw(fromCenter: centerPoint, radius: 0, toCenter: centerPoint, radius: rect.width * 0.48, options: [])

    // 3. Outer Precision Progress / Zero Ring (CleanMyMac / Sensei style)
    let ringRadius = rect.width * 0.335
    let ringWidth = rect.width * 0.042

    // Subtle track ring
    let trackPath = NSBezierPath()
    trackPath.appendArc(withCenter: centerPoint, radius: ringRadius, startAngle: 0, endAngle: 360)
    trackPath.lineWidth = ringWidth
    NSColor(calibratedWhite: 1.0, alpha: 0.07).setStroke()
    trackPath.stroke()

    // Glowing active sweep arc (from -45 deg counter-clockwise to 225 deg = 270 deg arc)
    let cg = ctx.cgContext
    NSGraphicsContext.saveGraphicsState()
    let arcShadow = NSShadow()
    arcShadow.shadowColor = NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.50)
    arcShadow.shadowOffset = .zero
    arcShadow.shadowBlurRadius = s * 0.028
    arcShadow.set()
    let glowArc = NSBezierPath()
    glowArc.appendArc(withCenter: centerPoint, radius: ringRadius, startAngle: -45, endAngle: 225, clockwise: false)
    glowArc.lineWidth = ringWidth
    glowArc.lineCapStyle = .round
    NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.85).setStroke()
    glowArc.stroke()
    NSGraphicsContext.restoreGraphicsState()

    // Smooth gradient fill inside the stroked arc path
    NSGraphicsContext.saveGraphicsState()
    cg.beginPath()
    cg.addArc(center: centerPoint, radius: ringRadius, startAngle: -45.0 * .pi / 180.0, endAngle: 225.0 * .pi / 180.0, clockwise: false)
    cg.setLineWidth(ringWidth)
    cg.setLineCap(.round)
    cg.replacePathWithStrokedPath()
    cg.clip()

    let arcGrad = NSGradient(colorsAndLocations:
        (NSColor(calibratedRed: 0.42, green: 0.88, blue: 1.0, alpha: 1.0), 0.0),
        (NSColor(calibratedRed: 0.08, green: 0.62, blue: 1.0, alpha: 1.0), 0.55),
        (NSColor(calibratedRed: 0.04, green: 0.44, blue: 0.96, alpha: 1.0), 1.0)
    )!
    let ringBounds = NSRect(
        x: centerPoint.x - ringRadius - ringWidth,
        y: centerPoint.y - ringRadius - ringWidth,
        width: (ringRadius + ringWidth) * 2,
        height: (ringRadius + ringWidth) * 2
    )
    arcGrad.draw(in: ringBounds, angle: -90)
    NSGraphicsContext.restoreGraphicsState()

    // 4. Center Emblem: Precision Brushed-Aluminum macOS Trash Bin
    let binW = rect.width * 0.27
    let binTopW = rect.width * 0.305
    let binH = rect.width * 0.295
    let binCenterY = centerPoint.y - rect.width * 0.025
    let binBottomY = binCenterY - binH * 0.5
    let binTopY = binCenterY + binH * 0.5
    let cornerR = rect.width * 0.038

    // Tapered rounded trapezoid for the bin body
    let bodyPath = NSBezierPath()
    let blX = centerPoint.x - binW * 0.5
    let brX = centerPoint.x + binW * 0.5
    let tlX = centerPoint.x - binTopW * 0.5
    let trX = centerPoint.x + binTopW * 0.5

    bodyPath.move(to: NSPoint(x: tlX + cornerR * 0.5, y: binTopY))
    bodyPath.line(to: NSPoint(x: trX - cornerR * 0.5, y: binTopY))
    bodyPath.curve(to: NSPoint(x: trX, y: binTopY - cornerR * 0.5),
                   controlPoint1: NSPoint(x: trX, y: binTopY),
                   controlPoint2: NSPoint(x: trX, y: binTopY - cornerR * 0.2))
    bodyPath.line(to: NSPoint(x: brX, y: binBottomY + cornerR))
    bodyPath.curve(to: NSPoint(x: brX - cornerR, y: binBottomY),
                   controlPoint1: NSPoint(x: brX, y: binBottomY + cornerR * 0.3),
                   controlPoint2: NSPoint(x: brX - cornerR * 0.3, y: binBottomY))
    bodyPath.line(to: NSPoint(x: blX + cornerR, y: binBottomY))
    bodyPath.curve(to: NSPoint(x: blX, y: binBottomY + cornerR),
                   controlPoint1: NSPoint(x: blX + cornerR * 0.3, y: binBottomY),
                   controlPoint2: NSPoint(x: blX, y: binBottomY + cornerR * 0.3))
    bodyPath.line(to: NSPoint(x: tlX, y: binTopY - cornerR * 0.5))
    bodyPath.curve(to: NSPoint(x: tlX + cornerR * 0.5, y: binTopY),
                   controlPoint1: NSPoint(x: tlX, y: binTopY - cornerR * 0.2),
                   controlPoint2: NSPoint(x: tlX, y: binTopY))
    bodyPath.close()

    // Drop shadow behind bin
    NSGraphicsContext.saveGraphicsState()
    let binShadow = NSShadow()
    binShadow.shadowColor = NSColor(calibratedWhite: 0.0, alpha: 0.55)
    binShadow.shadowOffset = NSSize(width: 0, height: -s * 0.015)
    binShadow.shadowBlurRadius = s * 0.03
    binShadow.set()
    NSColor.white.setFill()
    bodyPath.fill()
    NSGraphicsContext.restoreGraphicsState()

    // Fill bin body with crisp Apple Silver/Titanium vertical gradient
    let metalGrad = NSGradient(colorsAndLocations:
        (NSColor(calibratedRed: 0.96, green: 0.98, blue: 1.0, alpha: 1.0), 0.0),
        (NSColor(calibratedRed: 0.80, green: 0.85, blue: 0.92, alpha: 1.0), 0.55),
        (NSColor(calibratedRed: 0.64, green: 0.71, blue: 0.81, alpha: 1.0), 1.0)
    )!
    metalGrad.draw(in: bodyPath, angle: -90)

    // Subtle specular border on bin body
    NSColor(calibratedWhite: 1.0, alpha: 0.85).setStroke()
    bodyPath.lineWidth = max(1.0, s * 0.004)
    bodyPath.stroke()

    // 3 Vertical Recessed Slots inside the Bin
    let slotW = rect.width * 0.022
    let slotH = binH * 0.56
    let slotY = binBottomY + (binH - slotH) * 0.48
    let slotSpacing = binW * 0.25
    for offset in [-slotSpacing, 0.0, slotSpacing] {
        let slotRect = NSRect(x: centerPoint.x + offset - slotW * 0.5, y: slotY, width: slotW, height: slotH)
        let slotPath = NSBezierPath(roundedRect: slotRect, xRadius: slotW * 0.5, yRadius: slotW * 0.5)
        let slotGrad = NSGradient(colors: [
            NSColor(calibratedRed: 0.08, green: 0.14, blue: 0.24, alpha: 0.92),
            NSColor(calibratedRed: 0.04, green: 0.35, blue: 0.72, alpha: 0.92)
        ])!
        slotGrad.draw(in: slotPath, angle: -90)
    }

    // Floating Precision Lid above the Bin
    let lidW = binTopW * 1.12
    let lidH = rect.width * 0.038
    let lidY = binTopY + rect.width * 0.024
    let lidRect = NSRect(x: centerPoint.x - lidW * 0.5, y: lidY, width: lidW, height: lidH)
    let lidPath = NSBezierPath(roundedRect: lidRect, xRadius: lidH * 0.5, yRadius: lidH * 0.5)

    // Lid handle
    let handleW = lidW * 0.28
    let handleH = rect.width * 0.024
    let handleRect = NSRect(x: centerPoint.x - handleW * 0.5, y: lidY + lidH - s * 0.003, width: handleW, height: handleH)
    let handlePath = NSBezierPath(roundedRect: handleRect, xRadius: handleH * 0.5, yRadius: handleH * 0.5)

    NSGraphicsContext.saveGraphicsState()
    let lidShadow = NSShadow()
    lidShadow.shadowColor = NSColor(calibratedWhite: 0.0, alpha: 0.45)
    lidShadow.shadowOffset = NSSize(width: 0, height: -s * 0.008)
    lidShadow.shadowBlurRadius = s * 0.015
    lidShadow.set()
    NSColor(calibratedRed: 0.94, green: 0.97, blue: 1.0, alpha: 1.0).setFill()
    handlePath.fill()
    lidPath.fill()
    NSGraphicsContext.restoreGraphicsState()

    metalGrad.draw(in: handlePath, angle: -90)
    metalGrad.draw(in: lidPath, angle: -90)

    // 5. Crisp Green/Cyan Checkmark Badge at Bottom-Right of the Ring (Verified Clean)
    let badgeR = rect.width * 0.095
    let badgeCenter = NSPoint(
        x: centerPoint.x + ringRadius * cos(-45.0 * .pi / 180.0),
        y: centerPoint.y + ringRadius * sin(-45.0 * .pi / 180.0)
    )
    let badgeRect = NSRect(
        x: badgeCenter.x - badgeR,
        y: badgeCenter.y - badgeR,
        width: badgeR * 2,
        height: badgeR * 2
    )
    let badgePath = NSBezierPath(ovalIn: badgeRect)

    NSGraphicsContext.saveGraphicsState()
    let badgeShadow = NSShadow()
    badgeShadow.shadowColor = NSColor(calibratedWhite: 0.0, alpha: 0.45)
    badgeShadow.shadowOffset = NSSize(width: 0, height: -s * 0.008)
    badgeShadow.shadowBlurRadius = s * 0.018
    badgeShadow.set()
    NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 1.0).setFill()
    badgePath.fill()
    NSGraphicsContext.restoreGraphicsState()

    let badgeGrad = NSGradient(colors: [
        NSColor(calibratedRed: 0.20, green: 0.78, blue: 1.0, alpha: 1.0),
        NSColor(calibratedRed: 0.04, green: 0.48, blue: 0.98, alpha: 1.0)
    ])!
    badgeGrad.draw(in: badgePath, angle: -60)

    // White checkmark inside badge
    let checkPath = NSBezierPath()
    checkPath.move(to: NSPoint(x: badgeCenter.x - badgeR * 0.38, y: badgeCenter.y - badgeR * 0.02))
    checkPath.line(to: NSPoint(x: badgeCenter.x - badgeR * 0.08, y: badgeCenter.y - badgeR * 0.32))
    checkPath.line(to: NSPoint(x: badgeCenter.x + badgeR * 0.42, y: badgeCenter.y + badgeR * 0.28))
    checkPath.lineWidth = badgeR * 0.24
    checkPath.lineCapStyle = .round
    checkPath.lineJoinStyle = .round
    NSColor.white.setStroke()
    checkPath.stroke()

    // 6. Squircle Inner Rim Specular Border (Apple HIG style)
    let borderPath = NSBezierPath(roundedRect: rect.insetBy(dx: max(0.5, s * 0.004), dy: max(0.5, s * 0.004)),
                                  xRadius: radius, yRadius: radius)
    borderPath.lineWidth = max(1.0, s * 0.008)
    NSColor(calibratedWhite: 1.0, alpha: 0.16).setStroke()
    borderPath.stroke()

    NSGraphicsContext.restoreGraphicsState()
    NSGraphicsContext.restoreGraphicsState()

    if let png = rep.representation(using: .png, properties: [:]) {
        let url = URL(fileURLWithPath: outDir).appendingPathComponent(filename)
        try? png.write(to: url)
    }
}

let sizes: [(Int, String)] = [
    (16, "icon_16x16.png"),
    (32, "icon_16x16@2x.png"),
    (32, "icon_32x32.png"),
    (64, "icon_32x32@2x.png"),
    (128, "icon_128x128.png"),
    (256, "icon_128x128@2x.png"),
    (256, "icon_256x256.png"),
    (512, "icon_256x256@2x.png"),
    (512, "icon_512x512.png"),
    (1024, "icon_512x512@2x.png"),
]

for (sz, name) in sizes {
    drawIcon(size: sz, filename: name, fullBleed: false)
}

// Also generate a full-bleed 256x256 logo for the web UI sidebar
drawIcon(size: 256, filename: "sidebar_logo.png", fullBleed: true)

// Generate 1024x1024 full-bleed GitHub Profile Avatar (no transparent corners)
func drawGitHubProfileAvatar(size: Int, outPath: String) {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!

    NSGraphicsContext.saveGraphicsState()
    let ctx = NSGraphicsContext(bitmapImageRep: rep)!
    ctx.imageInterpolation = .high
    ctx.shouldAntialias = true
    NSGraphicsContext.current = ctx

    let s = CGFloat(size)
    let rect = NSRect(x: 0, y: 0, width: s, height: s)

    // Full-bleed dark slate/obsidian background for GitHub circular/rounded crop
    let bgGrad = NSGradient(colorsAndLocations:
        (NSColor(calibratedRed: 0.12, green: 0.15, blue: 0.22, alpha: 1.0), 0.0),
        (NSColor(calibratedRed: 0.07, green: 0.09, blue: 0.13, alpha: 1.0), 0.55),
        (NSColor(calibratedRed: 0.04, green: 0.05, blue: 0.08, alpha: 1.0), 1.0)
    )!
    bgGrad.draw(in: rect, angle: -90)

    let centerPoint = NSPoint(x: s * 0.5, y: s * 0.50)
    let glowGrad = NSGradient(colorsAndLocations:
        (NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.34), 0.0),
        (NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.10), 0.55),
        (NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.0), 1.0)
    )!
    glowGrad.draw(fromCenter: centerPoint, radius: 0, toCenter: centerPoint, radius: s * 0.45, options: [])

    let ringRadius = s * 0.33
    let ringWidth = s * 0.044

    let trackPath = NSBezierPath()
    trackPath.appendArc(withCenter: centerPoint, radius: ringRadius, startAngle: 0, endAngle: 360)
    trackPath.lineWidth = ringWidth
    NSColor(calibratedWhite: 1.0, alpha: 0.08).setStroke()
    trackPath.stroke()

    let cg = ctx.cgContext
    NSGraphicsContext.saveGraphicsState()
    let arcShadow = NSShadow()
    arcShadow.shadowColor = NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.55)
    arcShadow.shadowOffset = .zero
    arcShadow.shadowBlurRadius = s * 0.03
    arcShadow.set()
    let glowArc = NSBezierPath()
    glowArc.appendArc(withCenter: centerPoint, radius: ringRadius, startAngle: -45, endAngle: 225, clockwise: false)
    glowArc.lineWidth = ringWidth
    glowArc.lineCapStyle = .round
    NSColor(calibratedRed: 0.04, green: 0.52, blue: 1.0, alpha: 0.9).setStroke()
    glowArc.stroke()
    NSGraphicsContext.restoreGraphicsState()

    NSGraphicsContext.saveGraphicsState()
    cg.beginPath()
    cg.addArc(center: centerPoint, radius: ringRadius, startAngle: -45.0 * .pi / 180.0, endAngle: 225.0 * .pi / 180.0, clockwise: false)
    cg.setLineWidth(ringWidth)
    cg.setLineCap(.round)
    cg.replacePathWithStrokedPath()
    cg.clip()

    let arcGrad = NSGradient(colorsAndLocations:
        (NSColor(calibratedRed: 0.42, green: 0.88, blue: 1.0, alpha: 1.0), 0.0),
        (NSColor(calibratedRed: 0.08, green: 0.62, blue: 1.0, alpha: 1.0), 0.55),
        (NSColor(calibratedRed: 0.04, green: 0.44, blue: 0.96, alpha: 1.0), 1.0)
    )!
    let ringBounds = NSRect(
        x: centerPoint.x - ringRadius - ringWidth,
        y: centerPoint.y - ringRadius - ringWidth,
        width: (ringRadius + ringWidth) * 2,
        height: (ringRadius + ringWidth) * 2
    )
    arcGrad.draw(in: ringBounds, angle: -90)
    NSGraphicsContext.restoreGraphicsState()

    // Center Trash Bin
    let binW = s * 0.26
    let binTopW = s * 0.295
    let binH = s * 0.285
    let binCenterY = centerPoint.y - s * 0.024
    let binBottomY = binCenterY - binH * 0.5
    let binTopY = binCenterY + binH * 0.5
    let cornerR = s * 0.036

    let bodyPath = NSBezierPath()
    let blX = centerPoint.x - binW * 0.5
    let brX = centerPoint.x + binW * 0.5
    let tlX = centerPoint.x - binTopW * 0.5
    let trX = centerPoint.x + binTopW * 0.5

    bodyPath.move(to: NSPoint(x: tlX + cornerR * 0.5, y: binTopY))
    bodyPath.line(to: NSPoint(x: trX - cornerR * 0.5, y: binTopY))
    bodyPath.curve(to: NSPoint(x: trX, y: binTopY - cornerR * 0.5),
                   controlPoint1: NSPoint(x: trX, y: binTopY),
                   controlPoint2: NSPoint(x: trX, y: binTopY - cornerR * 0.2))
    bodyPath.line(to: NSPoint(x: brX, y: binBottomY + cornerR))
    bodyPath.curve(to: NSPoint(x: brX - cornerR, y: binBottomY),
                   controlPoint1: NSPoint(x: brX, y: binBottomY + cornerR * 0.3),
                   controlPoint2: NSPoint(x: brX - cornerR * 0.3, y: binBottomY))
    bodyPath.line(to: NSPoint(x: blX + cornerR, y: binBottomY))
    bodyPath.curve(to: NSPoint(x: blX, y: binBottomY + cornerR),
                   controlPoint1: NSPoint(x: blX + cornerR * 0.3, y: binBottomY),
                   controlPoint2: NSPoint(x: blX, y: binBottomY + cornerR * 0.3))
    bodyPath.line(to: NSPoint(x: tlX, y: binTopY - cornerR * 0.5))
    bodyPath.curve(to: NSPoint(x: tlX + cornerR * 0.5, y: binTopY),
                   controlPoint1: NSPoint(x: tlX, y: binTopY - cornerR * 0.2),
                   controlPoint2: NSPoint(x: tlX, y: binTopY))
    bodyPath.close()

    NSGraphicsContext.saveGraphicsState()
    let binShadow = NSShadow()
    binShadow.shadowColor = NSColor(calibratedWhite: 0.0, alpha: 0.55)
    binShadow.shadowOffset = NSSize(width: 0, height: -s * 0.015)
    binShadow.shadowBlurRadius = s * 0.03
    binShadow.set()
    NSColor.white.setFill()
    bodyPath.fill()
    NSGraphicsContext.restoreGraphicsState()

    let metalGrad = NSGradient(colorsAndLocations:
        (NSColor(calibratedRed: 0.96, green: 0.98, blue: 1.0, alpha: 1.0), 0.0),
        (NSColor(calibratedRed: 0.80, green: 0.85, blue: 0.92, alpha: 1.0), 0.55),
        (NSColor(calibratedRed: 0.64, green: 0.71, blue: 0.81, alpha: 1.0), 1.0)
    )!
    metalGrad.draw(in: bodyPath, angle: -90)

    let slotW = s * 0.021
    let slotH = binH * 0.56
    let slotY = binBottomY + (binH - slotH) * 0.48
    let slotSpacing = binW * 0.25
    for offset in [-slotSpacing, 0.0, slotSpacing] {
        let slotRect = NSRect(x: centerPoint.x + offset - slotW * 0.5, y: slotY, width: slotW, height: slotH)
        let slotPath = NSBezierPath(roundedRect: slotRect, xRadius: slotW * 0.5, yRadius: slotW * 0.5)
        let slotGrad = NSGradient(colors: [
            NSColor(calibratedRed: 0.08, green: 0.14, blue: 0.24, alpha: 0.92),
            NSColor(calibratedRed: 0.04, green: 0.35, blue: 0.72, alpha: 0.92)
        ])!
        slotGrad.draw(in: slotPath, angle: -90)
    }

    let lidW = binTopW * 1.12
    let lidH = s * 0.036
    let lidY = binTopY + s * 0.022
    let lidRect = NSRect(x: centerPoint.x - lidW * 0.5, y: lidY, width: lidW, height: lidH)
    let lidPath = NSBezierPath(roundedRect: lidRect, xRadius: lidH * 0.5, yRadius: lidH * 0.5)

    let handleW = lidW * 0.28
    let handleH = s * 0.022
    let handleRect = NSRect(x: centerPoint.x - handleW * 0.5, y: lidY + lidH - s * 0.003, width: handleW, height: handleH)
    let handlePath = NSBezierPath(roundedRect: handleRect, xRadius: handleH * 0.5, yRadius: handleH * 0.5)

    metalGrad.draw(in: handlePath, angle: -90)
    metalGrad.draw(in: lidPath, angle: -90)

    let badgeR = s * 0.092
    let badgeCenter = NSPoint(
        x: centerPoint.x + ringRadius * cos(-45.0 * .pi / 180.0),
        y: centerPoint.y + ringRadius * sin(-45.0 * .pi / 180.0)
    )
    let badgeRect = NSRect(
        x: badgeCenter.x - badgeR,
        y: badgeCenter.y - badgeR,
        width: badgeR * 2,
        height: badgeR * 2
    )
    let badgePath = NSBezierPath(ovalIn: badgeRect)
    let badgeGrad = NSGradient(colors: [
        NSColor(calibratedRed: 0.20, green: 0.78, blue: 1.0, alpha: 1.0),
        NSColor(calibratedRed: 0.04, green: 0.48, blue: 0.98, alpha: 1.0)
    ])!
    badgeGrad.draw(in: badgePath, angle: -60)

    let checkPath = NSBezierPath()
    checkPath.move(to: NSPoint(x: badgeCenter.x - badgeR * 0.38, y: badgeCenter.y - badgeR * 0.02))
    checkPath.line(to: NSPoint(x: badgeCenter.x - badgeR * 0.08, y: badgeCenter.y - badgeR * 0.32))
    checkPath.line(to: NSPoint(x: badgeCenter.x + badgeR * 0.42, y: badgeCenter.y + badgeR * 0.28))
    checkPath.lineWidth = badgeR * 0.24
    checkPath.lineCapStyle = .round
    checkPath.lineJoinStyle = .round
    NSColor.white.setStroke()
    checkPath.stroke()

    NSGraphicsContext.restoreGraphicsState()

    if let png = rep.representation(using: .png, properties: [:]) {
        try? png.write(to: URL(fileURLWithPath: outPath))
    }
}

drawGitHubProfileAvatar(size: 1024, outPath: "/Users/spiros/Desktop/ZeroTrash-GitHub-Profile-Icon.png")

// Also generate a high-res preview of the monochrome macOS Menu Bar Template Icon
func drawMonochromeMenuBarPreview(size: Int, outPath: String) {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!

    NSGraphicsContext.saveGraphicsState()
    let ctx = NSGraphicsContext(bitmapImageRep: rep)!
    ctx.imageInterpolation = .high
    ctx.shouldAntialias = true
    NSGraphicsContext.current = ctx

    let s = CGFloat(size)
    // Light macOS menu bar pill preview background
    let bgPath = NSBezierPath(roundedRect: NSRect(x: 0, y: 0, width: s, height: s), xRadius: s * 0.22, yRadius: s * 0.22)
    NSColor(calibratedWhite: 0.95, alpha: 1.0).setFill()
    bgPath.fill()

    let center = NSPoint(x: s * 0.5, y: s * 0.5)
    let ringRadius = s * 0.34
    let ringPath = NSBezierPath()
    ringPath.appendArc(withCenter: center, radius: ringRadius, startAngle: -35, endAngle: 225, clockwise: false)
    ringPath.lineWidth = s * 0.075
    ringPath.lineCapStyle = .round
    NSColor.black.setStroke()
    ringPath.stroke()

    let binW = s * 0.28
    let binTopW = s * 0.315
    let binH = s * 0.30
    let binBottomY = center.y - binH * 0.54
    let binTopY = binBottomY + binH

    let body = NSBezierPath()
    body.move(to: NSPoint(x: center.x - binTopW * 0.5, y: binTopY))
    body.line(to: NSPoint(x: center.x + binTopW * 0.5, y: binTopY))
    body.line(to: NSPoint(x: center.x + binW * 0.5, y: binBottomY))
    body.line(to: NSPoint(x: center.x - binW * 0.5, y: binBottomY))
    body.close()

    let slotW = s * 0.052
    let slotH = binH * 0.54
    let slotY = binBottomY + (binH - slotH) * 0.5
    for offset in [-binW * 0.18, binW * 0.18] {
        let slotRect = NSRect(x: center.x + offset - slotW * 0.5, y: slotY, width: slotW, height: slotH)
        body.append(NSBezierPath(roundedRect: slotRect, xRadius: slotW * 0.5, yRadius: slotW * 0.5))
    }
    body.windingRule = .evenOdd
    NSColor.black.setFill()
    body.fill()

    let lidW = binTopW * 1.16
    let lidH = s * 0.065
    let lidY = binTopY + s * 0.045
    let lidRect = NSRect(x: center.x - lidW * 0.5, y: lidY, width: lidW, height: lidH)
    NSBezierPath(roundedRect: lidRect, xRadius: lidH * 0.5, yRadius: lidH * 0.5).fill()

    let handleW = lidW * 0.34
    let handleH = s * 0.042
    let handleRect = NSRect(x: center.x - handleW * 0.5, y: lidY + lidH, width: handleW, height: handleH)
    NSBezierPath(roundedRect: handleRect, xRadius: handleH * 0.5, yRadius: handleH * 0.5).fill()

    let checkCenter = NSPoint(
        x: center.x + ringRadius * cos(-50.0 * .pi / 180.0),
        y: center.y + ringRadius * sin(-50.0 * .pi / 180.0)
    )
    let check = NSBezierPath()
    check.move(to: NSPoint(x: checkCenter.x - s * 0.085, y: checkCenter.y + s * 0.005))
    check.line(to: NSPoint(x: checkCenter.x - s * 0.02, y: checkCenter.y - s * 0.06))
    check.line(to: NSPoint(x: checkCenter.x + s * 0.105, y: checkCenter.y + s * 0.07))
    check.lineWidth = s * 0.072
    check.lineCapStyle = .round
    check.lineJoinStyle = .round
    NSColor.black.setStroke()
    check.stroke()

    NSGraphicsContext.restoreGraphicsState()
    if let png = rep.representation(using: .png, properties: [:]) {
        try? png.write(to: URL(fileURLWithPath: outPath))
    }
}

drawMonochromeMenuBarPreview(size: 512, outPath: "/Users/spiros/.gemini/antigravity/brain/c4751934-4acd-4cb2-a5fe-823bcce3ac31/zerotrash_menubar_bw_preview.png")

