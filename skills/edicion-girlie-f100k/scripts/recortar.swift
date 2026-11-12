// Recorta el sujeto de una foto (Vision de macOS, sin descargas) → PNG con fondo transparente.
// Uso: swift recortar.swift entrada.jpg salida.png
import Foundation; import Vision; import CoreImage; import AppKit
let a = CommandLine.arguments; let url = URL(fileURLWithPath: a[1])
let ci = CIImage(contentsOf: url)!
let req = VNGenerateForegroundInstanceMaskRequest(); let h = VNImageRequestHandler(ciImage: ci)
try h.perform([req]); let r = req.results!.first!
let buf = try r.generateMaskedImage(ofInstances: r.allInstances, from: h, croppedToInstancesExtent: true)
let out = CIImage(cvPixelBuffer: buf); let ctx = CIContext()
try ctx.writePNGRepresentation(of: out, to: URL(fileURLWithPath: a[2]), format: .RGBA8, colorSpace: CGColorSpaceCreateDeviceRGB())
print("ok", a[2])
