import { test } from 'node:test'
import assert from 'node:assert/strict'
import { analizar, mediana, repartirPiezas, validarLectura, derivar } from './motor.mjs'
import { postsCuentaMedida } from './fixture-cuenta-medida.mjs'

const clonar = () => structuredClone(postsCuentaMedida)

test('mediana par e impar; ignora null', () => {
  assert.equal(mediana([3, 1, 2]), 2)
  assert.equal(mediana([4, 1, 3, 2]), 2.5)
  assert.equal(mediana([null, 5]), 5)
  assert.equal(mediana([]), null)
})

test('columnas derivadas como la Hoja de Etiquetado', () => {
  const d = derivar({ vistas: 100296, guardados: 477, compartidos: 163, pct_no_seguidores: 77.7, seguidores_nuevos: 46 })
  assert.equal(d.valor_1000, 6.4)
  assert.equal(d.intencion, null)
})

test('Regla del Lote: menos de 9 posts no se lee', () => {
  const r = analizar({ posts: clonar().slice(0, 8), ventana: { dias_publicando: 40 } })
  assert.equal(r.lote.valido, false)
  assert.equal(r.filtros, undefined)
})

test('Regla del Lote: 9 posts en menos de 30 días tampoco', () => {
  const r = analizar({ posts: clonar().slice(0, 12) })
  assert.equal(r.lote.valido, false)
  assert.match(r.lote.motivo, /días/)
})

test('caso vivo del sílabo: el filtro 1 se tapa con los números medidos', () => {
  const r = analizar({ posts: clonar() })
  assert.equal(r.ventanas.modo, 'partido')
  assert.equal(r.ventanas.mes.n, 10)
  assert.equal(r.ventanas.base.desde, '2026-07-30')
  assert.equal(r.ventanas.base.hasta, '2026-08-19')
  const [vistas, pct] = r.filtros[0].comps
  assert.equal(vistas.base, 12062)
  assert.equal(vistas.mes, 5305)
  assert.equal(pct.base, 42.15)
  assert.equal(pct.mes, 37.2)
  assert.equal(r.tapado, 1)
  assert.equal(r.filtros[1].estado, 'no-se-lee')
  assert.equal(r.filtros[2].estado, 'no-se-lee')
})

test('el Valor subió (13,6 → 16,4) y aun así no se lee', () => {
  const r = analizar({ posts: clonar() })
  // se recalcula aparte para comprobar el dato del sílabo
  const base = r.posts.slice(10).map((p) => p.metricas.valor_1000)
  const mes = r.posts.slice(0, 10).map((p) => p.metricas.valor_1000)
  assert.equal(mediana(base), 13.55)
  assert.equal(mediana(mes), 16.4)
  assert.equal(r.filtros[2].estado, 'no-se-lee')
})

test('mediana vs promedio: 7.479,5 contra 16.473,7 y 24 de 30 bajo el promedio', () => {
  const r = analizar({ posts: clonar() })
  assert.equal(r.medianaVsPromedio.mediana, 7479.5)
  assert.equal(r.medianaVsPromedio.promedio, 16473.7)
  assert.equal(r.medianaVsPromedio.veces, 2.2)
  assert.equal(r.medianaVsPromedio.bajoPromedio, 24)
})

test('mezcla inclinada por filtro 1: 40/30/30', () => {
  const r = analizar({ posts: clonar(), piezas_mes: 12 })
  assert.deepEqual([r.reparto.rep, r.reparto.var_, r.reparto.apo], [40, 30, 30])
  const c = r.reparto.cubetas
  assert.equal(c.rep + c.var_ + c.apo, 12)
})

test('ORO y CHATARRA: 7 y 7 con 30 posts, redondeo hacia abajo', () => {
  const r = analizar({ posts: clonar() })
  assert.equal(r.cuarto, 7)
  assert.equal(r.posts.filter((p) => p.zona === 'ORO').length, 7)
  assert.equal(r.posts.filter((p) => p.zona === 'CHATARRA').length, 7)
  assert.equal(r.orden.columna, 'pct_no_seguidores')
})

test('ordenado por Valor, los virales 1.º y 3.º caen a CHATARRA y el 2.º no', () => {
  const todos = postsCuentaMedida.map((p) => p.n)
  // misma ventana a los dos lados ⇒ ningún filtro se tapa ⇒ se ordena por Valor
  const r = analizar({ posts: clonar(), ventanas: { base: todos, mes: todos } })
  assert.equal(r.tapado, 0)
  assert.equal(r.orden.columna, 'valor_1000')
  const zona = Object.fromEntries(r.posts.map((p) => [p.n, p.zona]))
  assert.equal(zona[29], 'CHATARRA') // 100.296 vistas, valor 6,4
  assert.equal(zona[30], 'CHATARRA') // 65.858 vistas, valor 4,3
  assert.notEqual(zona[16], 'CHATARRA') // 74.716 vistas, valor 16,5
  assert.deepEqual(r.engañoVistas.topVistasEnChatarra.sort((a, b) => a - b), [22, 29, 30]) // 3 de los 7 más vistos
})

test('veredicto por formato: 2 ORO repetir, 2 CHATARRA matar, 1 ORO confirmar', () => {
  const posts = clonar()
  const r0 = analizar({ posts })
  const oro = r0.ranking.filter((x) => x.zona === 'ORO').map((x) => x.n)
  const chat = r0.ranking.filter((x) => x.zona === 'CHATARRA').map((x) => x.n)
  const et = (n, formato) => { posts.find((p) => p.n === n).etiquetas = { formato, angulo: 'X', proposito: 'Nutrición' } }
  et(oro[0], 'Lista numerada'); et(oro[1], 'Lista numerada')
  et(chat[0], 'Vlog sin gancho'); et(chat[1], 'Vlog sin gancho')
  et(oro[2], 'Detrás de cámara')
  const r = analizar({ posts })
  const v = Object.fromEntries(r.formatos.map((f) => [f.formato, f.veredicto]))
  assert.equal(v['Lista numerada'], 'REPETIR')
  assert.equal(v['Vlog sin gancho'], 'MATAR')
  assert.equal(v['Detrás de cámara'], 'CONFIRMAR')
})

test('ángulo de Venta sin dato de intención no se corona', () => {
  const posts = clonar().map((p) => ({ ...p, etiquetas: { formato: 'F', angulo: 'Objeción', proposito: 'Venta' } }))
  const r = analizar({ posts })
  assert.equal(r.angulos.find((a) => a.proposito === 'Venta').estado, 'sin-dato')
})

test('ángulo de Crecimiento se corona por % no seguidores, no por el filtro tapado', () => {
  const posts = clonar().map((p) => ({ ...p, etiquetas: { formato: 'F', angulo: p.metricas.pct_no_seguidores > 70 ? 'Contraintuitivo' : 'Error común', proposito: 'Crecimiento' } }))
  const r = analizar({ posts })
  const c = r.angulos.find((a) => a.proposito === 'Crecimiento')
  assert.equal(c.estado, 'coronado')
  assert.equal(c.coronados[0].angulo, 'Contraintuitivo')
})

test('sin dato ni pasa ni se tapa: la lectura sigue', () => {
  const posts = clonar().map((p) => ({ ...p, metricas: { ...p.metricas } }))
  // mes con más alcance que la base para que el 1 pase
  posts.slice(0, 10).forEach((p) => { p.metricas.vistas *= 5; p.metricas.pct_no_seguidores = 80 })
  const r = analizar({ posts })
  assert.equal(r.filtros[0].estado, 'pasa')
  assert.equal(r.filtros[1].estado, 'sin-dato')
  assert.notEqual(r.filtros[2].estado, 'no-se-lee')
})

test('encuesta: con filtro 1 tapado no sirve', () => {
  assert.equal(analizar({ posts: clonar() }).encuesta.sirve, false)
})

test('repartirPiezas no pierde piezas', () => {
  assert.deepEqual(repartirPiezas(12, { rep: 40, var_: 30, apo: 30 }), { rep: 5, var_: 4, apo: 3 })
  assert.deepEqual(repartirPiezas(10, { rep: 60, var_: 40, apo: 0 }), { rep: 6, var_: 4, apo: 0 })
})

test('validarLectura caza lo que contradice al motor', () => {
  const posts = clonar().map((p) => ({ ...p, etiquetas: { formato: p.n % 2 ? 'A' : 'B', angulo: 'x', proposito: 'Crecimiento' } }))
  const r = analizar({ posts, piezas_mes: 4 })
  const errores = validarLectura(r, {
    preguntas: [{ pregunta: '¿?', evidencia: [99] }],
    aplicacion: { calendario: [{ de_donde_sale: 'REPETIR', formato: 'A' }], campana: 'algo' },
  })
  assert.ok(errores.some((e) => e.includes('99')))
  assert.ok(errores.some((e) => e.includes('piezas')))
  assert.ok(errores.some((e) => e.includes('campaña')))
})

// ── Las 3 conclusiones fijas ──
const conAngulos = (fn) => clonar().map((p) => ({ ...p, etiquetas: fn(p) }))

test('formato ganador: sale el REPETIR con sus Reels de ORO como referencia', () => {
  const posts = clonar()
  const r0 = analizar({ posts })
  const oro = r0.ranking.filter((x) => x.zona === 'ORO').map((x) => x.n)
  posts.forEach((p) => { p.etiquetas = { formato: oro.slice(0, 2).includes(p.n) ? 'Sketch' : 'Otro' + p.n, angulo: 'X', proposito: 'Crecimiento' } })
  const f = analizar({ posts }).conclusionesFijas.formato
  assert.equal(f.estado, 'repetir')
  assert.equal(f.ganadores[0].formato, 'Sketch')
  assert.deepEqual(f.ganadores[0].referencias, oro.slice(0, 2))
})

test('formato ganador: sin REPETIR sale el mejor CONFIRMAR como candidato', () => {
  const posts = clonar()
  const oro = analizar({ posts }).ranking.filter((x) => x.zona === 'ORO').map((x) => x.n)
  posts.forEach((p) => { p.etiquetas = { formato: p.n === oro[0] ? 'Demo' : 'Otro' + p.n, angulo: 'X', proposito: 'Crecimiento' } })
  const f = analizar({ posts }).conclusionesFijas.formato
  assert.equal(f.estado, 'candidato')
  assert.equal(f.ganadores[0].formato, 'Demo')
})

test('ángulo que viraliza: gana la mayor mediana de % no seguidores', () => {
  const posts = conAngulos((p) => ({ formato: 'F', angulo: p.metricas.pct_no_seguidores > 50 ? 'Curiosidad' : 'Método', proposito: 'Crecimiento' }))
  const v = analizar({ posts }).conclusionesFijas.anguloViral
  assert.equal(v.estado, 'ganador')
  assert.equal(v.angulo, 'Curiosidad')
  assert.equal(v.fuerza, 'patron')
  assert.equal(v.referencias[0], 29) // 77,7 %
})

test('ángulo que viraliza: un ángulo de 1 solo Reel no compite', () => {
  const posts = conAngulos((p) => ({ formato: 'F', angulo: p.n === 29 ? 'Único' : p.n % 2 ? 'A' : 'B', proposito: 'Crecimiento' }))
  const v = analizar({ posts }).conclusionesFijas.anguloViral
  assert.notEqual(v.angulo, 'Único')
  assert.ok(v.tabla.every((t) => t.angulo !== 'Único'))
})

test('ángulo de venta: sin intención usa conversión y lo marca como posible (proxy)', () => {
  const posts = conAngulos((p) => ({ formato: 'F', angulo: p.metricas.seguidores_nuevos >= 20 ? 'Método' : 'Opinión', proposito: 'Nutrición' }))
  const v = analizar({ posts }).conclusionesFijas.anguloVenta
  assert.equal(v.seguridad, 'proxy')
  assert.equal(v.columna, 'tasa_conv')
  assert.equal(v.angulo, 'Método')
})

test('ángulo de venta: con intención medida usa intención', () => {
  const posts = conAngulos((p) => ({ formato: 'F', angulo: p.n <= 15 ? 'Objeción' : 'Opinión', proposito: 'Crecimiento' }))
  posts.forEach((p) => { p.metricas.visitas_perfil = p.n <= 15 ? 90 : 10 })
  const v = analizar({ posts }).conclusionesFijas.anguloVenta
  assert.equal(v.seguridad, 'medido')
  assert.equal(v.angulo, 'Objeción')
})

test('validarLectura exige el detalle de cada fila y los ángulos fijos en el calendario', () => {
  const posts = conAngulos((p) => ({ formato: p.n % 2 ? 'A' : 'B', angulo: p.metricas.pct_no_seguidores > 50 ? 'Curiosidad' : 'Método', proposito: 'Crecimiento' }))
  const r = analizar({ posts, piezas_mes: 3 })
  const errores = validarLectura(r, {
    aplicacion: { calendario: [
      { de_donde_sale: 'REPETIR', formato: 'A', angulo: 'Método', referencia: { post: 2, que_copiar: 'todo' } },
      { de_donde_sale: 'APOSTAR', formato: 'B', angulo: 'Método', referencia: { biblioteca: 'B' } },
    ] },
  }, { biblioteca: ['Z'] })
  assert.ok(errores.some((e) => e.includes('falta el gancho')))
  assert.ok(errores.some((e) => e.includes('estructura')))
  assert.ok(errores.some((e) => e.includes('falta el CTA')))
  assert.ok(errores.some((e) => e.includes('otro formato'))) // #2 es formato B
  assert.ok(errores.some((e) => e.includes('ya usaste')))
  assert.ok(errores.some((e) => e.includes('no está en la Biblioteca')))
  assert.ok(errores.some((e) => e.includes('ángulo que viraliza')))
  assert.ok(errores.some((e) => e.includes('conclusiones_fijas')))
})

test('el ángulo fijo se aterriza a un tema: angulo_especifico obligatorio y fiel al motor', () => {
  const posts = conAngulos((p) => ({ formato: 'F', angulo: p.metricas.pct_no_seguidores > 50 ? 'Curiosidad' : 'Método', proposito: 'Crecimiento' }))
  const r = analizar({ posts, piezas_mes: 3 })
  const base = (viral, venta) => ({ conclusiones_fijas: {
    formato: { texto: 'x' },
    angulo_viral: { texto: 'x', angulo_especifico: viral },
    angulo_venta: { texto: 'x', angulo_especifico: venta },
  } })
  const venta = r.conclusionesFijas.anguloVenta.angulo
  const e1 = validarLectura(r, base(undefined, `${venta} paso a paso para automatizar tus anuncios`))
  assert.ok(e1.some((e) => e.includes('angulo_viral: falta angulo_especifico')))
  const e2 = validarLectura(r, base('Método para crear contenido con Claude', `${venta} paso a paso para automatizar tus anuncios`))
  assert.ok(e2.some((e) => e.includes('tiene que partir de «Curiosidad»')))
  const e3 = validarLectura(r, base('Curiosidad', `${venta} paso a paso para automatizar tus anuncios`))
  assert.ok(e3.some((e) => e.includes('repite la categoría')))
  const e4 = validarLectura(r, base('Curiosidad de cómo generar contenido automático con Claude', `${venta} paso a paso para automatizar tus anuncios`))
  assert.ok(!e4.some((e) => e.includes('angulo_especifico')))
})

// ── Calidad de la data: las estadísticas avanzadas ──
test('calidadDatos: sin capturas de la app, retención y perfil quedan sin dato con la lista de Reels', () => {
  const r = analizar({ posts: clonar() })
  const [ret, perfil] = r.calidadDatos.avanzadas
  assert.equal(ret.estado, 'sin-dato')
  assert.equal(perfil.faltan.length, 30)
  assert.equal(r.calidadDatos.completa, false)
  // prioridad: el mínimo de cada ventana (5 de este mes + 5 de la base), no los 30
  assert.equal(ret.prioridad.length, 10)
  assert.deepEqual(ret.prioridad.slice(0, 5), [1, 2, 3, 4, 5])
  const zona = Object.fromEntries(r.posts.map((p) => [p.n, p.zona]))
  assert.ok(ret.prioridad.slice(5).every((n) => ['ORO', 'CHATARRA'].includes(zona[n])))
})

test('un filtro no se lee con 2 capturas sueltas: hace falta el mínimo por ventana', () => {
  const posts = clonar()
  posts.slice(0, 10).forEach((p) => { p.metricas.vistas *= 5; p.metricas.pct_no_seguidores = 80 }) // pasa el 1
  posts.find((p) => p.n === 1).metricas.retencion_3s = 40
  posts.find((p) => p.n === 20).metricas.retencion_3s = 90
  assert.equal(analizar({ posts }).filtros[1].estado, 'sin-dato')
  posts.forEach((p) => { p.metricas.retencion_3s = p.n <= 10 ? 40 : 90 })
  const r = analizar({ posts })
  assert.equal(r.filtros[1].estado, 'tapado')
  assert.equal(r.calidadDatos.avanzadas[0].estado, 'completo')
})

test('validarLectura: con data avanzada incompleta, esta_semana tiene que pedir las capturas', () => {
  const r = analizar({ posts: clonar(), piezas_mes: 12 })
  assert.ok(validarLectura(r, { aplicacion: { esta_semana: ['Graba', 'Sube'] } }).some((e) => e.includes('capturar')))
  assert.ok(!validarLectura(r, { aplicacion: { esta_semana: ['Captura Retención de 10 Reels'] } }).some((e) => e.includes('capturar')))
})
