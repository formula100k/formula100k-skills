// caras.swift — detecta la cara más grande de cada imagen (Vision de macOS, sin descargas).
// uso: swift caras.swift img1.jpg img2.jpg ... > caras.json
// salida: { "img1.jpg": [x, y, w, h] }  en fracciones 0..1 de la imagen, origen arriba a la izquierda.
// Sirve para que la mira se enganche a la CARA COMPLETA (no a un ojo ni a la boca).
import Foundation
import Vision
import AppKit
var out: [String: [Double]] = [:]
for p in CommandLine.arguments.dropFirst() {
  guard let img = NSImage(contentsOfFile: p), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let req = VNDetectFaceRectanglesRequest()
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  let caras = (req.results ?? []).sorted { $0.boundingBox.width * $0.boundingBox.height > $1.boundingBox.width * $1.boundingBox.height }
  if let c = caras.first {
    let b = c.boundingBox
    out[(p as NSString).lastPathComponent] = [b.minX, 1 - b.maxY, b.width, b.height].map { (Double($0) * 10000).rounded() / 10000 }
  }
}
let data = try! JSONSerialization.data(withJSONObject: out, options: [.sortedKeys])
print(String(data: data, encoding: .utf8)!)
