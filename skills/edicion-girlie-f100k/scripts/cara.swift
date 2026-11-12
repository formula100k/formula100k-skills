// Devuelve la caja de la cara más grande de una imagen (Vision de macOS) en píxeles: x y ancho alto
// Uso: swift cara.swift cuadro.png
import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
guard args.count > 1, let img = NSImage(contentsOfFile: args[1]),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("sin-imagen"); exit(1)
}
let req = VNDetectFaceRectanglesRequest()
try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
let W = Double(cg.width), H = Double(cg.height)
guard let caras = req.results, !caras.isEmpty else { print("sin-cara"); exit(0) }
let c = caras.max { $0.boundingBox.width < $1.boundingBox.width }!.boundingBox
// Vision mide desde abajo; lo pasamos a coordenadas de imagen (desde arriba)
let x = c.origin.x * W, w = c.width * W, h = c.height * H
let y = H - (c.origin.y + c.height) * H
print(String(format: "%.0f %.0f %.0f %.0f", x, y, w, h))
