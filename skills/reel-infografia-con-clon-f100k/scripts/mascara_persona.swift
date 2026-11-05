// mascara_persona.swift — saca la silueta de la persona de un video SIN fondo verde.
// Usa la segmentación de personas de macOS (Vision), sin instalar nada.
// Uso: swift mascara_persona.swift <entrada.mov> <mascara.mov> [rapida|buena]
// Salida: video en escala de grises (blanco = persona) con los mismos tiempos que la entrada.
import AVFoundation
import Vision
import CoreImage

let args = CommandLine.arguments
guard args.count >= 3 else { print("uso: mascara_persona.swift <entrada> <salida.mov> [rapida|buena]"); exit(1) }
let calidad: VNGeneratePersonSegmentationRequest.QualityLevel = (args.count > 3 && args[3] == "rapida") ? .balanced : .accurate

let asset = AVURLAsset(url: URL(fileURLWithPath: args[1]))
let sem = DispatchSemaphore(value: 0)
var pista: AVAssetTrack?
Task { pista = try? await asset.loadTracks(withMediaType: .video).first; sem.signal() }
sem.wait()
guard let track = pista else { print("sin pista de video"); exit(1) }

var tam = CGSize.zero; var transform = CGAffineTransform.identity
Task { tam = (try? await track.load(.naturalSize)) ?? .zero; transform = (try? await track.load(.preferredTransform)) ?? .identity; sem.signal() }
sem.wait()
let girado = tam.applying(transform)
let W = Int(abs(girado.width)), H = Int(abs(girado.height))

let reader = try! AVAssetReader(asset: asset)
let out = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
out.alwaysCopiesSampleData = false
reader.add(out)

let urlSalida = URL(fileURLWithPath: args[2])
try? FileManager.default.removeItem(at: urlSalida)
let writer = try! AVAssetWriter(outputURL: urlSalida, fileType: .mov)
let entrada = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 12_000_000]])
entrada.expectsMediaDataInRealTime = false
let adaptador = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: entrada, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA, kCVPixelBufferWidthKey as String: W, kCVPixelBufferHeightKey as String: H])
writer.add(entrada)
reader.startReading(); writer.startWriting(); writer.startSession(atSourceTime: .zero)

let ci = CIContext()
let req = VNGeneratePersonSegmentationRequest()
req.qualityLevel = calidad
req.outputPixelFormat = kCVPixelFormatType_OneComponent8
// orientación del video (iPhone graba con rotación en metadatos)
func orientacion(_ t: CGAffineTransform) -> CGImagePropertyOrientation {
  if t.b == 1 && t.c == -1 { return .right }
  if t.b == -1 && t.c == 1 { return .left }
  if t.a == -1 && t.d == -1 { return .down }
  return .up
}
let ori = orientacion(transform)
var n = 0
while let muestra = out.copyNextSampleBuffer() {
  guard let px = CMSampleBufferGetImageBuffer(muestra) else { continue }
  let pts = CMSampleBufferGetPresentationTimeStamp(muestra)
  let h = VNImageRequestHandler(cvPixelBuffer: px, orientation: ori)
  try? h.perform([req])
  guard let m = req.results?.first?.pixelBuffer else { continue }
  var img = CIImage(cvPixelBuffer: m)
  img = img.transformed(by: CGAffineTransform(scaleX: CGFloat(W) / img.extent.width, y: CGFloat(H) / img.extent.height))
  while !entrada.isReadyForMoreMediaData { usleep(2000) }
  var buf: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptador.pixelBufferPool!, &buf)
  ci.render(img, to: buf!, bounds: CGRect(x: 0, y: 0, width: W, height: H), colorSpace: CGColorSpaceCreateDeviceGray())
  adaptador.append(buf!, withPresentationTime: pts)
  n += 1
  if n % 300 == 0 { print("  \(n) cuadros…") }
}
entrada.markAsFinished()
writer.finishWriting { sem.signal() }
sem.wait()
print("✅ máscara: \(n) cuadros \(W)x\(H) → \(args[2])")
