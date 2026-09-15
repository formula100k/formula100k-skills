#!/usr/bin/env node
// Arma el informe: datos.json (+ lectura.json) → motor → validador → HTML de un solo archivo.
//
//   node render.mjs --datos datos.json [--lectura lectura.json] --salida informe.html
//   node render.mjs --datos datos.json --solo-motor resultado.json   (para que la IA lea los números)
//   --vista clase   abre en La clase (para enseñar); por defecto abre en Mi hoja
//   --artifact      sin <html>/<head>, para publicar como Artifact de claude.ai
//
// Si el validador encuentra contradicciones entre lo que escribió la IA y el motor,
// NO escribe el informe y lista los errores (salida 2). --forzar lo escribe igual.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { analizar, validarLectura } from './motor.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const arg = (k) => { const i = args.indexOf(k); return i > -1 ? args[i + 1] : null }

const rutaDatos = arg('--datos')
if (!rutaDatos) { console.error('Falta --datos datos.json'); process.exit(1) }
const datos = JSON.parse(readFileSync(rutaDatos, 'utf8'))
const base = dirname(resolve(rutaDatos))

const resultado = analizar(datos)

if (arg('--solo-motor')) {
  writeFileSync(arg('--solo-motor'), JSON.stringify(resultado, null, 2))
  console.log(`Motor listo → ${arg('--solo-motor')} · filtro tapado: ${resultado.tapado || 'ninguno'}`)
  process.exit(0)
}

const lectura = arg('--lectura') ? JSON.parse(readFileSync(arg('--lectura'), 'utf8')) : {}
const errores = validarLectura(resultado, lectura)
if (errores.length) {
  console.error(`El validador encontró ${errores.length} contradicción(es) con el motor:\n- ` + errores.join('\n- '))
  if (!args.includes('--forzar')) process.exit(2)
}

// Portadas embebidas: el informe es UN archivo que se abre sin internet.
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
for (const p of resultado.posts) {
  if (!p.portada || p.portada.startsWith('data:') || p.portada.startsWith('http')) continue
  const ruta = resolve(base, p.portada)
  if (existsSync(ruta)) p.portada = `data:${MIME[extname(ruta).toLowerCase()] || 'image/jpeg'};base64,${readFileSync(ruta).toString('base64')}`
  else p.portada = null
}
// El transcript completo no viaja al HTML (pesa y no se muestra); el gancho sí, vía lectura.videos.
for (const p of resultado.posts) { delete p.transcript; delete p.video }

const plantilla = readFileSync(resolve(aqui, '../plantilla/informe.html'), 'utf8')
const json = JSON.stringify({ cuenta: datos.cuenta || {}, vista_inicial: arg('--vista') || 'hoja', resultado, lectura }).replace(/</g, '\\u003c')
let html = plantilla.replace('/*__DATOS__*/', json)
// Por defecto sale un HTML completo que se abre con doble clic o se sube a una web.
// --artifact omite el esqueleto, porque el visor de Artifacts pone el suyo.
if (!args.includes('--artifact')) {
  html = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    html.replace(/(<\/style>)/, '$1\n</head>\n<body>') + '\n</body>\n</html>\n'
}
const salida = arg('--salida') || 'informe.html'
writeFileSync(salida, html)
console.log(`Informe → ${salida} (${Math.round(html.length / 1024)} KB) · filtro tapado: ${resultado.tapado || 'ninguno'} · ${errores.length} aviso(s)`)
