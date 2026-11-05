// Detecta el rostro más grande de cada imagen con Vision (macOS, sin dependencias).
// Uso: rostro img1.jpg [img2.jpg ...]  -> una línea JSON por imagen, en píxeles con origen arriba a la izquierda:
// {"archivo":..., "ancho":W, "alto":H, "rostro":{"x":..,"y":..,"w":..,"h":..,"cejas":..,"barbilla":..}}  (rostro null si no hay)
import Foundation
import Vision
import ImageIO

for ruta in CommandLine.arguments.dropFirst() {
    var salida: [String: Any] = ["archivo": ruta, "rostro": NSNull()]
    guard let fuente = CGImageSourceCreateWithURL(URL(fileURLWithPath: ruta) as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(fuente, 0, nil) else {
        salida["error"] = "no se pudo abrir"
        print(String(data: try! JSONSerialization.data(withJSONObject: salida), encoding: .utf8)!)
        continue
    }
    let W = Double(img.width), H = Double(img.height)
    salida["ancho"] = W; salida["alto"] = H
    let pedido = VNDetectFaceLandmarksRequest()
    try? VNImageRequestHandler(cgImage: img, options: [:]).perform([pedido])
    if let cara = (pedido.results ?? []).max(by: { $0.boundingBox.width * $0.boundingBox.height < $1.boundingBox.width * $1.boundingBox.height }) {
        let b = cara.boundingBox  // normalizado, origen abajo a la izquierda
        var r: [String: Double] = ["x": b.minX * W, "y": (1 - b.maxY) * H, "w": b.width * W, "h": b.height * H]
        let tam = CGSize(width: W, height: H)
        // pointsInImage también va con origen abajo: y_arriba = H - y
        if let contorno = cara.landmarks?.faceContour?.pointsInImage(imageSize: tam), !contorno.isEmpty {
            r["barbilla"] = H - contorno.map { Double($0.y) }.min()!
        }
        let cejas = [cara.landmarks?.leftEyebrow, cara.landmarks?.rightEyebrow]
            .compactMap { $0?.pointsInImage(imageSize: tam) }.flatMap { $0 }
        if !cejas.isEmpty { r["cejas"] = H - cejas.map { Double($0.y) }.max()! }
        salida["rostro"] = r
    }
    print(String(data: try! JSONSerialization.data(withJSONObject: salida), encoding: .utf8)!)
}
