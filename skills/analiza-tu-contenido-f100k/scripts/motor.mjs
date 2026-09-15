// ═══════════════════════════════════════════════════════════════════
// MOTOR — Analiza tu Contenido (FÓRMULA 100K)
//
// Toda la aritmética del método vive aquí y SOLO aquí. La IA etiqueta
// y redacta; nunca calcula un número que salga en el informe.
// Sin dependencias: corre igual en Node, en el navegador o dentro de una app web.
//
// Reglas (idénticas a EL TABLERO y a la guía del Grimorio):
//   · Regla del Lote: ≥ 9 posts Y ≥ 30 días publicando.
//   · Siempre MEDIANA, nunca promedio.
//   · Línea base vs este mes. Primer mes: 20 más viejos vs 10 más nuevos.
//   · Los 5 filtros se leen EN ORDEN; el primero que cae es el tapado
//     y los de atrás no se leen. Sin dato = ni pasa ni se tapa.
//   · Filtro 1 es un «y»: vistas Y % no seguidores ≥ línea base.
//   · ORO = 25 % de arriba, CHATARRA = 25 % de abajo, redondeo hacia abajo.
//   · Una vez es suerte, dos es patrón.
// ═══════════════════════════════════════════════════════════════════

export const LOTE_MINIMO = 9
export const DIAS_MINIMOS = 30

export const FILTROS = [
  { n: 1, nombre: 'Alcance', pregunta: '¿Te vieron fuera de tu casa?',
    columna: 'pct_no_seguidores', columnaEtiqueta: '% de vistas de no seguidores',
    arreglo: 'El tema solo se entiende si ya te conocen. Tu trabajo del mes es darle entrada al desconocido: contexto en los primeros segundos y temas que no dependan de conocerte.' },
  { n: 2, nombre: 'Retención', pregunta: '¿Se quedaron viendo?',
    columna: 'retencion_3s', columnaEtiqueta: 'retención a los 3 segundos',
    arreglo: 'Si la caída es a los 3 segundos, el problema es el gancho. Si la caída es al medio, el problema es el ritmo y el desarrollo.' },
  { n: 3, nombre: 'Valor', pregunta: '¿Les sirvió tanto como para guardarlo o mandarlo?',
    columna: 'valor_1000', columnaEtiqueta: 'guardados + compartidos por cada 1.000 vistas',
    arreglo: 'Es contenido de consumo: se ve y se olvida. Tu trabajo del mes es subir un peldaño — de SAFE a REAL, de REAL a RAW, de RAW a ÚTIL.' },
  { n: 4, nombre: 'Conversión', pregunta: '¿El que llegó de afuera quiso quedarse?',
    columna: 'tasa_conv', columnaEtiqueta: 'seguidores nuevos por cada 100 vistas de no seguidores',
    arreglo: 'Llegaron y no se quedaron porque no prometiste que hay más. Tu trabajo del mes es la promesa de serie y el perfil que la sostiene.' },
  { n: 5, nombre: 'Intención', pregunta: '¿Te buscaron para lo que ofreces?',
    columna: 'intencion', columnaEtiqueta: 'visitas al perfil + toques al enlace + DMs',
    arreglo: 'El contenido funciona, la oferta no se está pidiendo. Tu trabajo del mes es el CTA y la oferta, no el contenido.' },
]

export const MEZCLAS = {
  0: { rep: 60, var_: 30, apo: 10, nota: 'Ningún filtro se tapó. La mezcla se queda en la base 60 / 30 / 10: se sostiene lo que ya funciona y se sigue midiendo.' },
  1: { rep: 40, var_: 30, apo: 30, nota: 'Filtro tapado 1 · Alcance. APOSTAR sube a 30 %: tus formatos ya no salen de tu casa y hace falta sangre nueva. VARIAR se queda en 30 %; los 20 puntos salen enteros de REPETIR.' },
  2: { rep: 60, var_: 30, apo: 10, nota: 'Filtro tapado 2 · Retención. La mezcla no se mueve, pero todo el trabajo del mes va al gancho: mismo molde, primeros 3 segundos rehechos.' },
  3: { rep: 50, var_: 40, apo: 10, nota: 'Filtro tapado 3 · Valor. VARIAR sube a 40 %: mismo formato ganador, ángulo un peldaño más útil. Ese 10 % sale de REPETIR.' },
  4: { rep: 60, var_: 40, apo: 0, nota: 'Filtro tapado 4 · Conversión. No se tocan los formatos: APOSTAR baja a 0 % y ese 10 % se va a VARIAR — mismo formato, ángulo hacia promesa y serie.' },
  5: { rep: 60, var_: 30, apo: 10, nota: 'Filtro tapado 5 · Intención. La mezcla no se mueve: el trabajo del mes es la oferta y el CTA, no el contenido.' },
}

export const PROPOSITOS = ['Experimentación', 'Crecimiento', 'Nutrición', 'Venta']

export const ANGULOS_QUE_PESAN = {
  Experimentación: { lista: ['Opinión', 'Curiosidad', 'Lista abierta'], por: 'Amplios a propósito: sirven para descubrir a quién le hablas.' },
  Crecimiento: { lista: ['Error común', 'Dolor concreto', 'Contraintuitivo'], por: 'Le hablan a quien todavía no te conoce.' },
  Nutrición: { lista: ['Método', 'Detrás de escena', 'Creencia'], por: 'Construyen confianza en quien ya llegó.' },
  Venta: { lista: ['Prueba / resultado', 'Objeción', 'Comparación'], por: 'Mueven de «me gusta lo que veo» a «lo quiero».' },
}

// Un ángulo se corona con la columna de SU trabajo, no con la del filtro tapado.
export const CORONA_ANGULO = {
  Crecimiento: { filtro: 1, columna: 'pct_no_seguidores', trabajo: 'salir de tu casa' },
  Nutrición: { filtro: 3, columna: 'valor_1000', trabajo: 'servirle a quien ya llegó' },
  Venta: { filtro: 5, columna: 'intencion', trabajo: 'mover a alguien hacia tu oferta' },
  Experimentación: null,
}

// ── utilidades ────────────────────────────────────────────────────
const esNum = (x) => typeof x === 'number' && Number.isFinite(x)

export function mediana(valores) {
  const v = valores.filter(esNum).sort((a, b) => a - b)
  if (v.length === 0) return null
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

export function promedio(valores) {
  const v = valores.filter(esNum)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

const redondear = (x, dec) => (esNum(x) ? Math.round(x * 10 ** dec) / 10 ** dec : null)

// Columnas que Instagram no da y el método necesita.
export function derivar(m = {}) {
  const vistas = m.vistas
  const gc = esNum(m.guardados) || esNum(m.compartidos) ? (m.guardados || 0) + (m.compartidos || 0) : null
  const valor_1000 = esNum(vistas) && vistas > 0 && gc !== null ? redondear((gc / vistas) * 1000, 1) : null
  const vistasNoSeg = esNum(vistas) && esNum(m.pct_no_seguidores) ? (vistas * m.pct_no_seguidores) / 100 : null
  const tasa_conv = esNum(m.seguidores_nuevos) && vistasNoSeg ? redondear((m.seguidores_nuevos / vistasNoSeg) * 100, 2) : null
  const señales = [m.visitas_perfil, m.toques_enlace, m.dms]
  const intencion = señales.some(esNum) ? señales.reduce((a, b) => a + (esNum(b) ? b : 0), 0) : null
  return { valor_1000, tasa_conv, intencion }
}

function diasEntre(a, b) {
  return Math.round(Math.abs(new Date(b) - new Date(a)) / 86400000) + 1
}

// Reparte N piezas respetando porcentajes (resto mayor), sin perder ni sumar piezas.
export function repartirPiezas(total, pct) {
  const claves = Object.keys(pct)
  const exactos = claves.map((k) => ({ k, x: (total * pct[k]) / 100 }))
  const base = Object.fromEntries(exactos.map(({ k, x }) => [k, Math.floor(x)]))
  let faltan = total - Object.values(base).reduce((a, b) => a + b, 0)
  exactos
    .map(({ k, x }) => ({ k, resto: x - Math.floor(x) }))
    .sort((a, b) => b.resto - a.resto)
    .forEach(({ k }) => { if (faltan > 0 && pct[k] > 0) { base[k]++; faltan-- } })
  return base
}

// ── núcleo ────────────────────────────────────────────────────────
export function analizar(datos) {
  const posts = [...(datos.posts || [])]
    .map((p) => {
      const m = { ...(p.metricas || {}) }
      return { ...p, metricas: { ...m, ...derivar(m) } }
    })
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : a.n - b.n)) // más nuevo primero

  const fechas = posts.map((p) => p.fecha).filter(Boolean).sort()
  const diasPublicando = datos.ventana?.dias_publicando ?? (fechas.length ? diasEntre(fechas[0], fechas[fechas.length - 1]) : 0)
  const lote = {
    n: posts.length,
    dias: diasPublicando,
    valido: posts.length >= LOTE_MINIMO && diasPublicando >= DIAS_MINIMOS,
  }
  lote.motivo = lote.valido
    ? `${lote.n} posts en ${lote.dias} días: hay lote.`
    : posts.length < LOTE_MINIMO
      ? `Solo ${posts.length} posts. Con menos de ${LOTE_MINIMO} esto todavía es anécdota, no data.`
      : `Solo ${diasPublicando} días publicando. Hacen falta ${DIAS_MINIMOS}.`

  const salida = { lote, posts, generado: new Date().toISOString().slice(0, 10) }
  if (!lote.valido) return salida

  // Ventanas: explícitas, o primer mes partido 20/10 (proporción 2/3 – 1/3 si no son 30).
  let base, mes, modo
  if (datos.ventanas?.base?.length && datos.ventanas?.mes?.length) {
    const porN = new Map(posts.map((p) => [p.n, p]))
    base = datos.ventanas.base.map((n) => porN.get(n)).filter(Boolean)
    mes = datos.ventanas.mes.map((n) => porN.get(n)).filter(Boolean)
    modo = 'explicito'
  } else {
    const nMes = posts.length === 30 ? 10 : Math.round(posts.length / 3)
    mes = posts.slice(0, nMes)
    base = posts.slice(nMes)
    modo = 'partido'
  }
  const rango = (arr) => {
    const f = arr.map((p) => p.fecha).sort()
    return { desde: f[0], hasta: f[f.length - 1], n: arr.length, posts: arr.map((p) => p.n) }
  }
  salida.ventanas = { modo, base: rango(base), mes: rango(mes) }

  // ── Los 5 filtros ──
  const col = (arr, k) => arr.map((p) => p.metricas[k])
  const comp = (et, k, dec, unidad = '') => {
    const b = mediana(col(base, k)), mm = mediana(col(mes, k))
    if (b === null || mm === null) return null
    return { et, columna: k, base: redondear(b, dec), mes: redondear(mm, dec), unidad, ok: mm >= b }
  }
  const comps = {
    1: [comp('vistas', 'vistas', 1), comp('% de no seguidores', 'pct_no_seguidores', 2, ' %')],
    2: [comp('retención a 3 s', 'retencion_3s', 1, ' %'), comp('duración media', 'duracion_media', 1, ' s')],
    3: [comp('valor por 1.000 vistas', 'valor_1000', 1)],
    4: [comp('tasa de conversión', 'tasa_conv', 2, ' %')],
    5: [comp('visitas + enlace + DMs', 'intencion', 1)],
  }
  let tapado = 0
  salida.filtros = FILTROS.map((f) => {
    const cs = comps[f.n].filter(Boolean)
    let estado
    if (tapado > 0) estado = 'no-se-lee'
    else if (cs.length === 0) estado = 'sin-dato'
    else if (cs.some((c) => !c.ok)) { estado = 'tapado'; tapado = f.n }
    else estado = 'pasa'
    return { ...f, comps: cs, estado }
  })
  salida.tapado = tapado
  salida.tapadoInfo = tapado ? FILTROS[tapado - 1] : null

  // Referencia de la clase: mediana vs promedio de vistas (la mentira del promedio).
  const vistas = col(posts, 'vistas')
  const medV = mediana(vistas), promV = promedio(vistas)
  salida.medianaVsPromedio = {
    mediana: redondear(medV, 1),
    promedio: redondear(promV, 1),
    veces: redondear(promV / medV, 1),
    bajoPromedio: vistas.filter((v) => esNum(v) && v < promV).length,
  }

  // ── Orden por la columna del filtro tapado ──
  // Criterio de la casa: sin filtro tapado, se ordena por Valor (siempre medible en el panel).
  const filtroOrden = tapado || 3
  const columnaOrden = FILTROS[filtroOrden - 1].columna
  salida.orden = {
    filtro: filtroOrden,
    columna: columnaOrden,
    etiqueta: FILTROS[filtroOrden - 1].columnaEtiqueta,
    porDefecto: tapado === 0,
  }

  const conValor = posts.filter((p) => esNum(p.metricas[columnaOrden]))
  const porFiltro = [...conValor].sort((a, b) => b.metricas[columnaOrden] - a.metricas[columnaOrden] || a.n - b.n)
  const porVistas = [...posts].filter((p) => esNum(p.metricas.vistas)).sort((a, b) => b.metricas.vistas - a.metricas.vistas || a.n - b.n)
  const cuarto = Math.floor(porFiltro.length * 0.25)
  const zona = new Map()
  porFiltro.forEach((p, i) => zona.set(p.n, i < cuarto ? 'ORO' : i >= porFiltro.length - cuarto ? 'CHATARRA' : 'TIBIO'))
  salida.cuarto = cuarto
  salida.ranking = porFiltro.map((p, i) => ({
    n: p.n,
    posFiltro: i + 1,
    posVistas: porVistas.findIndex((q) => q.n === p.n) + 1,
    valor: p.metricas[columnaOrden],
    vistas: p.metricas.vistas,
    zona: zona.get(p.n),
  }))
  posts.forEach((p) => { p.zona = zona.get(p.n) || 'SIN DATO' })

  // Los que las vistas coronarían y el filtro manda al fondo (y al revés).
  const topVistas = porVistas.slice(0, cuarto).map((p) => p.n)
  salida.engañoVistas = {
    topVistasEnChatarra: topVistas.filter((n) => zona.get(n) === 'CHATARRA'),
    topVistasEnOro: topVistas.filter((n) => zona.get(n) === 'ORO'),
    topVistas,
  }

  // ── Veredicto por formato ──
  const grupos = (clave, filas) => {
    const g = new Map()
    filas.forEach((p) => {
      const k = p.etiquetas?.[clave]?.trim()
      if (!k) return
      if (!g.has(k)) g.set(k, [])
      g.get(k).push(p)
    })
    return g
  }
  salida.formatos = [...grupos('formato', posts)].map(([formato, ps]) => {
    const oro = ps.filter((p) => p.zona === 'ORO').length
    const chatarra = ps.filter((p) => p.zona === 'CHATARRA').length
    let veredicto
    if (oro >= 2 && chatarra >= 2) veredicto = 'EN DISPUTA'
    else if (oro >= 2) veredicto = 'REPETIR'
    else if (chatarra >= 2) veredicto = 'MATAR'
    else if (oro === 1) veredicto = 'CONFIRMAR'
    else veredicto = 'SIN VEREDICTO'
    return { formato, veces: ps.length, oro, chatarra, veredicto, posts: ps.map((p) => p.n) }
  }).sort((a, b) => b.oro - a.oro || a.chatarra - b.chatarra || b.veces - a.veces)

  // ── Coronación de ángulos, por propósito y con SU columna ──
  const porProp = grupos('proposito', posts)
  salida.angulos = PROPOSITOS.map((prop) => {
    const regla = CORONA_ANGULO[prop]
    const filas = porProp.get(prop) || []
    if (!regla) return { proposito: prop, estado: 'no-se-corona', motivo: 'Experimentación sirve para descubrir a quién le hablas, no para ganar.', filas: filas.length, coronados: [] }
    const medibles = filas.filter((p) => esNum(p.metricas[regla.columna]))
    const c = Math.floor(medibles.length * 0.25)
    if (filas.length === 0) return { proposito: prop, ...regla, estado: 'vacio', motivo: 'Ningún post con este propósito en el lote.', filas: 0, coronados: [] }
    if (medibles.length === 0) return { proposito: prop, ...regla, estado: 'sin-dato', motivo: `Falta el dato del filtro ${regla.filtro}: este mes no se puede coronar un ángulo de ${prop.toLowerCase()}.`, filas: filas.length, coronados: [] }
    if (c < 1) return { proposito: prop, ...regla, estado: 'pocas-filas', motivo: `Solo ${medibles.length} post${medibles.length === 1 ? '' : 's'} medible${medibles.length === 1 ? '' : 's'}: no alcanza para partir en cuartos.`, filas: filas.length, coronados: [] }
    const arriba = [...medibles].sort((a, b) => b.metricas[regla.columna] - a.metricas[regla.columna] || a.n - b.n).slice(0, c)
    const cuenta = new Map()
    arriba.forEach((p) => { const a = p.etiquetas?.angulo?.trim(); if (a) cuenta.set(a, (cuenta.get(a) || 0) + 1) })
    const coronados = [...cuenta].filter(([, v]) => v >= 2).map(([angulo, veces]) => ({ angulo, veces }))
    const candidatos = [...cuenta].filter(([, v]) => v === 1).map(([angulo]) => angulo)
    return {
      proposito: prop, ...regla, filas: filas.length, arriba: arriba.map((p) => p.n), coronados, candidatos,
      estado: coronados.length ? 'coronado' : 'sin-corona',
      motivo: coronados.length ? '' : 'Ningún ángulo apareció 2 veces arriba: una vez es suerte.',
    }
  })

  // ── Reparto ──
  const mz = MEZCLAS[tapado]
  const piezas = datos.piezas_mes || 12
  salida.reparto = { ...mz, piezas, cubetas: repartirPiezas(piezas, { rep: mz.rep, var_: mz.var_, apo: mz.apo }) }
  const prop = datos.proposito_mes
  salida.propositoMes = prop || null
  salida.angulosQuePesan = prop ? ANGULOS_QUE_PESAN[prop] : null

  // La encuesta no sirve si el filtro tapado es 1 o 2 (quien responde ya te sigue).
  salida.encuesta = [1, 2].includes(tapado)
    ? { sirve: false, motivo: `Tu filtro tapado es el ${tapado}. Quien responde una encuesta ya te sigue: preguntarle cómo llegar a quien no te conoce es preguntarle al lugar equivocado. Este mes, sáltala.` }
    : { sirve: true, motivo: 'La encuesta desempata, no decide: la data elige el MOLDE, la encuesta elige el TEMA.' }

  return salida
}

// ── Validador de la parte que escribe la IA ──────────────────────
// Rechaza lo que contradiga al motor: posts inexistentes, formatos
// muertos en REPETIR, cubetas con otro número de piezas, etc.
export function validarLectura(resultado, lectura) {
  const errores = []
  const ns = new Set(resultado.posts.map((p) => p.n))
  const refs = (arr, donde) => (arr || []).forEach((n) => { if (!ns.has(n)) errores.push(`${donde}: el post ${n} no existe en el lote`) })

  ;(lectura.preguntas || []).forEach((q, i) => refs(q.evidencia, `pregunta ${i + 1}`))
  ;(lectura.conclusiones || []).forEach((c, i) => refs(c.evidencia, `conclusión ${i + 1}`))

  const cal = lectura.aplicacion?.calendario || []
  if (resultado.reparto && cal.length) {
    const cuenta = { REPETIR: 0, VARIAR: 0, APOSTAR: 0 }
    cal.forEach((f) => { if (f.de_donde_sale in cuenta) cuenta[f.de_donde_sale]++ })
    const esperado = resultado.reparto.cubetas
    if (cal.length !== resultado.reparto.piezas) errores.push(`calendario: ${cal.length} piezas, el reparto pide ${resultado.reparto.piezas}`)
    if (cuenta.REPETIR !== esperado.rep) errores.push(`calendario: ${cuenta.REPETIR} en REPETIR, el reparto pide ${esperado.rep}`)
    if (cuenta.VARIAR !== esperado.var_) errores.push(`calendario: ${cuenta.VARIAR} en VARIAR, el reparto pide ${esperado.var_}`)
    if (cuenta.APOSTAR !== esperado.apo) errores.push(`calendario: ${cuenta.APOSTAR} en APOSTAR, el reparto pide ${esperado.apo}`)
    const muertos = new Set(resultado.formatos.filter((f) => f.veredicto === 'MATAR').map((f) => f.formato))
    const ganadores = new Set(resultado.formatos.filter((f) => f.veredicto === 'REPETIR').map((f) => f.formato))
    cal.forEach((f, i) => {
      if (muertos.has(f.formato)) errores.push(`calendario fila ${i + 1}: «${f.formato}» tiene veredicto MATAR`)
      if (f.de_donde_sale === 'REPETIR' && ganadores.size && !ganadores.has(f.formato)) errores.push(`calendario fila ${i + 1}: REPETIR con «${f.formato}», que no tiene veredicto REPETIR`)
      refs(f.evidencia, `calendario fila ${i + 1}`)
    })
  }
  if (lectura.aplicacion?.campana && !resultado.angulos?.find((a) => a.proposito === 'Venta' && a.estado === 'coronado')) {
    errores.push('campaña: no hay ángulo de Venta coronado; una campaña sin ángulo probado es un anuncio con prisa')
  }
  return errores
}
