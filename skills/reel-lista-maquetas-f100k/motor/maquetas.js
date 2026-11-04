// ============================================================================
// LIBRERÍA DE MAQUETAS — cada tipo devuelve el HTML del centro de una escena.
// Coordenadas en px dentro del centro (1080 x 980). Tiempos en segundos desde que
// empieza la escena, ya escalados con T(): una maqueta pensada para 2,6 s se estira
// o se encoge sola si la voz dura más o menos.
//
// Atributos que lee el motor:
//   data-t="s"           aparece en el segundo s, con corte seco (nunca fundido ni rebote)
//   data-hasta="s"       desaparece en el segundo s
//   data-a="s0,s1"       pone --p de 0 a 1 entre s0 y s1 (barra que se llena, punto que viaja)
//   data-cuenta="a,b"    con data-a: escribe un reloj mm:ss que va de a a b segundos
//   data-sfx="pop|swish|golpe"  sonido grave en el momento en que aparece (o empieza data-a)
// El único movimiento permitido es el que cuenta la acción.
// ============================================================================
(function () {
const SVG = (d, w = 2.2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  servidor: SVG('<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>'),
  candado: SVG('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  check: SVG('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 3),
  x: SVG('<path d="M6 6l12 12M18 6L6 18"/>', 3),
  globo: SVG('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'),
  reloj: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  usuario: SVG('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  enviar: SVG('<path d="M4 12l16-8-6 16-2.5-6.5z"/>'),
  escudo: SVG('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'),
  llave: SVG('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3"/>'),
  alerta: SVG('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>'),
  rayo: SVG('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  lupa: SVG('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  correo: SVG('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
  ojo: SVG('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  calendario: SVG('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
};
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// atributos de tiempo
const A = (t, o = {}) => ` data-t="${(+t).toFixed(2)}"` + (o.hasta != null ? ` data-hasta="${(+o.hasta).toFixed(2)}"` : '') +
  (o.a ? ` data-a="${o.a.map(v => (+v).toFixed(2)).join(',')}"` : '') + (o.sfx ? ` data-sfx="${o.sfx}"` : '');
const nav = (url, x, y, w, body, t, extra = '') =>
  `<div class="card" style="left:${x}px;top:${y}px;width:${w}px"${A(t)}${extra}><div class="nav-top"><div class="dots"><i></i><i></i><i></i></div>` +
  `<div class="url">${url.startsWith('https') ? `<span style="color:var(--verde)">${I.candado}</span>` : ''}${esc(url)}</div></div><div class="body">${body}</div></div>`;
const chip = (titulo, x, y, w, t, sub, sfx = 'pop', icono = 'servidor') =>
  `<div class="chip-srv" style="left:${x}px;top:${y}px;width:${w}px"${A(t, { sfx })}><div class="t">${I[icono] || I.servidor}${esc(titulo)}</div>` +
  `<div class="ln" style="width:85%"></div><div class="ln" style="width:55%;margin-top:8px"></div>` +
  (sub ? `<div class="sub">${I.candado}${esc(sub)}</div>` : '') + `</div>`;
const pill = (tipo, txt, x, y, t, sfx = 'pop', extra = '') => {
  const ico = tipo === 'ok' ? I.check : tipo === 'no' ? I.x : '';
  return `<div class="pill ${tipo}" style="left:${x}px;top:${y}px${extra}"${A(t, { sfx })}>${ico}${esc(txt)}</div>`;
};
const pillC = (tipo, txt, y, t, sfx = 'pop') => pill(tipo, txt, 0, y, t, sfx, ';left:50%;transform:translateX(-50%)');
const sello = (ok, x, y, t) => `<div class="sello ${ok ? 'ok' : 'no'}" style="left:${x - 46}px;top:${y - 46}px"${A(t, { sfx: 'golpe' })}>${ok ? I.check : I.x}</div>`;
// línea que se dibuja de (x1,y1) a (x2,y2) y un punto que viaja por ella entre t0 y t1
function linea(x1, y1, x2, y2, t0, t1, o = {}) {
  const L = Math.hypot(x2 - x1, y2 - y1).toFixed(1), col = o.color || 'rgba(79,91,255,.55)';
  const hasta = o.corta ? o.corta : 1;   // fracción del recorrido (una petición rechazada se queda a medio camino)
  let s = `<svg class="lineas"${A(t0)}><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="3" ${o.punteada ? 'stroke-dasharray="10 10"' : ''}/></svg>`;
  if (o.punto !== false) {
    const px = (a, b) => `calc(${a}px + ${(b - a) * hasta}px * var(--p))`;
    s += `<div class="dot" style="left:${px(x1, x2)};top:${px(y1, y2)};${o.colorPunto ? 'background:' + o.colorPunto : ''}"${A(t0, { a: [t0, t1], sfx: o.sfx === undefined ? 'swish' : o.sfx, hasta: o.ocultar })}></div>`;
  }
  return s;
}

// ----------------------------------------------------------------------------
const M = {};

// 1. Gancho / intro: la app en el centro y las peticiones de ataque que le llegan
M.objetivo = (p, c) => {
  const { T } = c, tiles = p.tiles || ['Menú', 'Pedidos', 'Pagos'];
  const ataques = p.ataques || ['POST /login', 'GET /admin', 'GET /.env', 'DELETE /pedidos'];
  const pos = [[110, 300], [760, 300], [770, 800], [100, 800]];
  let h = p.mascota !== false ? M.mascota({ x: 470, y: 90 }, c) : '';
  h += nav(c.dominio, 200, 380, 680, `<div class="fila"><div style="font-weight:800;font-size:34px">${esc(p.app || 'Mi app')}</div><div class="lbl" style="color:var(--verde)">${esc(p.estado || 'en línea')}</div></div>` +
    `<div style="display:flex;gap:16px;margin-top:20px">${tiles.map(n => `<div style="flex:1;height:130px;border-radius:16px;background:#F1F2F8;display:grid;place-items:center;font-weight:700;font-size:22px;color:#545A73">${esc(n)}</div>`).join('')}</div>` +
    `<div style="height:8px;border-radius:4px;background:#E3E6F2;margin-top:22px"><div style="height:8px;width:62%;border-radius:4px;background:var(--verde)"></div></div>`, 0);
  ataques.slice(0, 4).forEach((a, i) => { h += `<div class="tag no" style="left:${pos[i][0]}px;top:${pos[i][1]}px"${A(T(.25 + i * .28), { sfx: 'pop' })}>● ${esc(a)}</div>`; });
  return h;
};

// 2. Navegador con formulario → servidor que comprueba
M.formulario = (p, c) => {
  const { T } = c, campos = p.campos || [{ label: 'Email', valor: 'ana@ejemplo.com' }, { label: 'Contraseña', valor: '••••••••••' }];
  const checks = p.checks || ['Hash de contraseña', 'Cuenta activa'];
  let body = campos.map(f => `<div class="campo"><div class="lbl">${esc(f.label)}</div><div class="v">${esc(f.valor)}</div></div>`).join('');
  body += `<div style="position:relative"><div class="boton">${esc(p.boton || 'Entrar')}</div><div class="boton pres" style="position:absolute;inset:0;margin:0"${A(T(.7))}>${esc(p.boton || 'Entrar')}</div></div>`;
  const alto = 64 + 52 + campos.length * 92 + 78;
  let h = nav(p.url || c.dominio + '/login', 200, 0, 680, body, 0);
  h += linea(540, alto + 6, 290, 590, T(.75), T(1.2));
  h += chip(p.servidor || 'Tu servidor', 130, 590, 320, T(1.2), p.sub || 'Almacén secreto');
  h += `<div class="card" style="left:500px;top:590px;width:460px"${A(T(1.35))}><div class="body"><div class="lbl">${esc(p.titulo_checks || 'Comprobaciones del servidor')}</div>` +
    checks.map((k, i) => `<div style="display:flex;gap:12px;align-items:center;margin-top:16px;font-weight:600;font-size:25px"><span style="width:30px;height:30px;color:var(--verde);display:grid"${A(T(1.55 + i * .3), { sfx: 'pop' })}>${I.check}</span>${esc(k)}</div>`).join('') + `</div></div>`;
  return h;
};

// 3. Tarjeta de código con la línea peligrosa → el secreto viaja al servidor
M.codigo = (p, c) => {
  const { T } = c, lineas = p.lineas || [{ txt: 'fetch(climaUrl, {' }, { txt: '  key: "sk_demo_7f3a…"', marca: 'mal' }, { txt: '})' }];
  const code = lineas.map(l => `<div style="position:relative">` +
    (l.marca ? `<div class="${l.marca === 'mal' ? 'mal' : 'bien'}" style="position:absolute;inset:0 -10px;z-index:0;border-radius:6px;background:${l.marca === 'mal' ? 'var(--rojo-bg)' : 'var(--verde-bg)'}"${A(T(.55))}></div>` : '') +
    `<span style="position:relative;${l.marca === 'mal' ? 'color:var(--rojo)' : ''}">${esc(l.txt)}</span></div>`).join('');
  const alto = 64 + 52 + 34 + lineas.length * 43;
  let h = nav(p.url || c.dominio, 140, 0, 800, `<div class="lbl">${esc(p.etiqueta || 'app.js · se ejecuta en el navegador')}</div><div class="code" style="margin-top:14px">${code}</div>`, 0);
  if (p.alerta !== false) h += pill('no', p.alerta || 'Cualquiera la ve', 600, alto - 20, T(.75));
  if (p.secreto !== false) {
    h += chip(p.servidor || 'Tu servidor', 110, 560, 360, T(1.0), p.sub || 'Almacén secreto');
    // la clave sale del código y entra al servidor (movimiento que cuenta la acción)
    h += `<div class="tag ok" style="left:calc(560px - 420px * var(--p));top:calc(${alto - 90}px + ${720 - alto + 90}px * var(--p))"${A(T(1.1), { a: [T(1.1), T(1.7)], sfx: 'swish' })}>${I.llave.replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px"')} ${esc(p.clave || 'sk_demo_7f3a…')}</div>`;
  }
  if (p.tercero) h += `<div class="card" style="left:610px;top:590px;width:360px"${A(T(1.3))}><div class="body"><div class="lbl">${esc(p.tercero.etiqueta || 'Tercero')}</div><div style="display:flex;gap:10px;align-items:center;margin-top:10px;font-weight:700;font-size:26px"><span style="width:30px;color:var(--acento);display:grid">${I.globo}</span>${esc(p.tercero.titulo || p.tercero)}</div></div></div>`;
  return h;
};

// 4. Base de datos (cilindro plano) + tabla donde solo se ven tus filas
M.basedatos = (p, c) => {
  const { T } = c, filas = p.filas || [{ txt: 'Pedido #18', dueno: 'ana', mio: true }, { txt: 'Pedido #22', dueno: 'leo' }, { txt: 'Pedido #31', dueno: 'sofi' }];
  let h = `<div class="abs" style="left:100px;top:230px;width:270px;height:330px"${A(0)}>` +
    `<div class="abs" style="left:0;right:0;top:45px;bottom:45px;background:var(--acento)"></div>` +
    `<div class="abs" style="left:0;right:0;bottom:0;height:90px;border-radius:50%;background:var(--acento-osc)"></div>` +
    [130, 215].map(y => `<div class="abs" style="left:0;right:0;top:${y - 45}px;height:90px;border-radius:50%;border-bottom:6px solid rgba(255,255,255,.35)"></div>`).join('') +
    `<div class="abs" style="left:0;right:0;top:0;height:90px;border-radius:50%;background:#8E95FF"></div></div>`;
  h += pill('az', p.sesion || 'Sesión: Ana', 560, 120, T(.15), 'pop');
  h += `<div class="card" style="left:430px;top:200px;width:540px"${A(T(.1))}><div class="body"><div class="fila"><div class="lbl">${esc(p.etiqueta || 'Pedidos')}</div>` +
    `<div class="pill ok" style="position:static;font-size:19px"${A(T(.7), { sfx: 'pop' })}>${I.candado}${esc(p.regla || 'Solo el dueño')}</div></div>` +
    filas.map((f, i) => `<div style="position:relative;margin-top:14px;padding:14px 16px;border-radius:12px;background:${f.mio ? '#F0F1FF' : '#F6F7FB'}" class="fila">` +
      `<span style="font-weight:700;font-size:25px">${esc(f.txt)}</span><span class="mono" style="font-size:19px;color:var(--gris)">dueña: ${esc(f.dueno)}</span>` +
      (f.mio ? '' : `<div class="abs" style="inset:0;border-radius:12px;background:rgba(246,247,251,.86);display:flex;align-items:center;justify-content:flex-end;padding-right:16px"${A(T(1.0 + i * .2), { sfx: i === 1 ? 'golpe' : null })}><span class="tag no" style="position:static">${I.candado.replace('<svg', '<svg style="width:16px;height:16px;vertical-align:-2px"')} oculto</span></div>`) + `</div>`).join('') + `</div></div>`;
  return h;
};

// 5. Candado: la conexión cifrada (HTTPS) del navegador al servidor
M.candado = (p, c) => {
  const { T } = c;
  let h = nav(p.url || 'https://' + c.dominio, 170, 0, 740, `<div class="fila"><div class="campo" style="margin:0;flex:1"><div class="v" style="margin:0">${esc(p.dato || 'ana@ejemplo.com')}</div></div><div class="boton" style="margin:0;padding:0 26px;height:56px">${esc(p.boton || 'Enviar')}</div></div>`, 0);
  h += linea(540, 190, 540, 640, T(.3), T(1.5), { punto: true });
  h += `<div class="abs" style="left:460px;top:290px;width:160px;height:200px"${A(T(.2), { sfx: 'golpe' })}>` +
    `<div class="abs" style="left:28px;top:0;width:104px;height:110px;border:22px solid var(--verde);border-bottom:none;border-radius:52px 52px 0 0"></div>` +
    `<div class="abs" style="left:0;top:86px;width:160px;height:114px;border-radius:22px;background:var(--verde)"></div>` +
    `<div class="abs" style="left:68px;top:122px;width:24px;height:24px;border-radius:50%;background:#0F5A31"></div><div class="abs" style="left:75px;top:140px;width:10px;height:26px;border-radius:4px;background:#0F5A31"></div></div>`;
  h += `<div class="tag ok" style="left:660px;top:300px"${A(T(.8))}>${esc(p.cifrado || 'q7Zb…x9Le·4Fh2')}</div>`;
  h += pill('ok', p.nota || 'Cifrado en tránsito', 650, 380, T(1.1));
  h += chip(p.servidor || 'Tu servidor', 390, 640, 300, T(.55), null);
  return h;
};

// 6. Registro de actividad: filas que entran una a una, las raras en rojo
M.registro = (p, c) => {
  const { T } = c, filas = p.filas || [
    { h: '12:01:04', txt: 'login ok', quien: 'ana' }, { h: '12:01:09', txt: 'login fallido', quien: 'leo', mal: true },
    { h: '12:01:10', txt: 'login fallido', quien: 'leo', mal: true }, { h: '12:01:10', txt: 'login fallido', quien: 'leo', mal: true },
    { h: '12:01:11', txt: 'login fallido', quien: 'leo', mal: true }, { h: '12:01:13', txt: 'pedido pagado', quien: 'ana' }];
  const paso = Math.min(.25, 1.3 / filas.length);
  let h = `<div class="card" style="left:100px;top:40px;width:880px"${A(0)}><div class="body"><div class="fila"><div class="lbl">${esc(p.etiqueta || 'Registro de actividad')}</div><div class="pill ok" style="position:static;font-size:19px">● ${esc(p.vivo || 'En vivo')}</div></div><div style="margin-top:12px">` +
    filas.map((f, i) => `<div class="fila mono" style="padding:9px 14px;border-radius:8px;font-size:23px;margin-top:4px;${f.mal ? 'background:var(--rojo-bg);color:var(--rojo)' : ''}"${A(T(.2 + i * paso), { sfx: f.mal && i === filas.findIndex(x => x.mal) ? 'pop' : null })}>` +
      `<span><span style="opacity:.6">${esc(f.h)}</span>&nbsp;&nbsp;${esc(f.txt)}</span><span style="opacity:.7">${esc(f.quien)}</span></div>`).join('') + `</div></div></div>`;
  if (p.final !== false) h += pillC('no', p.final || 'Alerta: 4 intentos seguidos', 40 + 120 + filas.length * 54 + 70, T(.3 + filas.length * paso + .15));
  return h;
};

// 7. Tabla de variables de entorno: lo público, lo secreto y lo expuesto
M.variables = (p, c) => {
  const { T } = c, filas = p.filas || [
    { nombre: 'PUBLIC_APP_NAME', valor: 'MiApp', tipo: 'publico' }, { nombre: 'PUBLIC_PAY_SECRET', valor: 'sk_live…', tipo: 'expuesto' },
    { nombre: 'DATABASE_URL', valor: '••••••••', tipo: 'secreto' }];
  const ix = filas.findIndex(f => f.tipo === 'expuesto');
  let h = `<div class="card" style="left:90px;top:0;width:900px"${A(0)}><div class="body"><div class="fila"><div class="lbl">${esc(p.etiqueta || 'env · config')}</div>` +
    `<div class="pill az" style="position:static;font-size:19px">${I.lupa}${esc(p.estado || 'Revisando')}</div></div>` +
    filas.map((f, i) => `<div class="fila mono" style="position:relative;padding:14px 16px;margin-top:8px;border-radius:10px;font-size:23px">` +
      (f.tipo === 'expuesto' ? `<div class="abs" style="inset:0;border-radius:10px;background:var(--rojo-bg)"${A(T(.6), { sfx: 'pop' })}></div>` : '') +
      `<span style="position:relative;font-weight:700">${esc(f.nombre)}</span><span style="position:relative;color:var(--gris)">${esc(f.valor)}&nbsp;&nbsp;` +
      `<span class="pill ${f.tipo === 'expuesto' ? 'no' : f.tipo === 'secreto' ? 'ok' : 'az'}" style="position:static;font-size:17px;padding:4px 12px">${f.tipo === 'expuesto' ? 'expuesto' : f.tipo === 'secreto' ? 'servidor' : 'público'}</span></span></div>`).join('') + `</div></div>`;
  const yb = 120 + filas.length * 72 + 60;
  h += `<div class="card" style="left:90px;top:${yb}px;width:410px"${A(T(.9))}><div class="body"><div class="lbl">${esc(p.cliente || 'Paquete del cliente')}</div><div style="display:flex;gap:10px;align-items:center;margin-top:10px;font-weight:700;font-size:26px"><span style="width:28px;display:grid;color:var(--gris)">${I.ojo}</span>${esc(p.cliente_txt || 'Cualquiera lo lee')}</div></div></div>`;
  h += `<div class="card" style="left:560px;top:${yb}px;width:430px;border:3px solid var(--verde)"${A(T(1.05))}><div class="body"><div class="lbl">${esc(p.servidor || 'Solo servidor')}</div><div style="display:flex;gap:10px;align-items:center;margin-top:10px;font-weight:700;font-size:26px"><span style="width:28px;display:grid;color:var(--verde)">${I.candado}</span>${esc(p.servidor_txt || 'Nunca se envía')}</div></div></div>`;
  if (ix >= 0) { const y0 = 120 + ix * 72 + 70; h += `<div class="tag ok" style="left:calc(160px + 610px * var(--p));top:calc(${y0}px + ${yb + 18 - y0}px * var(--p))"${A(T(1.25), { a: [T(1.25), T(1.85)], sfx: 'swish' })}>${esc((filas[ix].nombre || '').replace(/^PUBLIC_/, ''))}</div>`; }
  return h;
};

// 8. Tarjeta con regla: lo que escribe la persona → el servidor lo valida
M.regla = (p, c) => {
  const { T } = c, pruebas = p.pruebas || [{ valor: '2', ok: true, txt: 'Aceptado' }, { valor: '-50', ok: false, txt: 'Rechazado' }];
  let h = nav(p.url || c.dominio + '/tienda', 170, 0, 740, `<div class="fila" style="gap:16px"><div class="campo" style="margin:0;flex:1"><div class="lbl">${esc(p.campo || 'Cantidad')}</div><div class="v">${esc(pruebas[0].valor)}</div></div><div class="boton" style="margin:0;padding:0 34px">${esc(p.boton || 'Pedir')}</div></div>`, 0);
  h += linea(540, 210, 280, 470, T(.3), T(.75));
  h += chip(p.servidor || 'Tu servidor', 120, 470, 320, T(.75), null);
  h += `<div class="card" style="left:480px;top:470px;width:480px"${A(T(.9))}><div class="body"><div class="lbl">${esc(p.etiqueta || 'Regla del servidor')}</div><div class="mono" style="font-size:30px;font-weight:700;margin-top:12px">${esc(p.regla || 'cantidad: 1 a 10')}</div></div></div>`;
  pruebas.forEach((r, i) => {
    h += `<div class="tag ${r.ok ? 'ok' : 'no'}" style="left:520px;top:${680 + i * 76}px"${A(T(1.3 + i * .45))}>${esc(p.campo || 'cantidad')} = ${esc(r.valor)}</div>`;
    h += pill(r.ok ? 'ok' : 'no', r.txt || (r.ok ? 'Aceptado' : 'Rechazado'), 760, 674 + i * 76, T(1.45 + i * .45));
  });
  return h;
};

// 9. Galleta de sesión: la tabla de cookies del navegador, banderas que se marcan
M.galleta = (p, c) => {
  const { T } = c, flags = p.banderas || [{ n: 'HttpOnly', d: 'JavaScript no la lee' }, { n: 'Secure', d: 'Solo por HTTPS' }, { n: 'SameSite', d: 'Strict' }];
  const chips = [[48, 60], [120, 40], [80, 120], [150, 110], [40, 150], [118, 165]];
  let h = `<div class="abs" style="left:120px;top:20px;width:210px;height:210px;border-radius:50%;background:#D49A5C"${A(0)}>` +
    chips.map(([x, y]) => `<div class="abs" style="left:${x}px;top:${y}px;width:26px;height:22px;border-radius:9px;background:#6B3E1C"></div>`).join('') + `</div>`;
  h += pill('gr', p.nombre || 'sesión', 270, 175, 0, null);
  h += `<div class="card" style="left:90px;top:300px;width:900px"${A(T(.1))}><div class="nav-top"><div class="lbl">${esc(p.etiqueta || 'Navegador · Cookies · ' + c.dominio)}</div></div>` +
    `<div class="body"><div class="fila mono" style="font-size:19px;color:var(--gris);font-weight:700"><span style="width:170px">NAME</span><span style="width:170px">VALUE</span>${flags.map(f => `<span style="flex:1;text-align:center">${esc(f.n.toUpperCase())}</span>`).join('')}</div>` +
    `<div class="fila mono" style="font-size:24px;margin-top:14px;padding:12px 0;border-top:1px solid var(--linea)"><span style="width:170px;font-weight:700">${esc(p.nombre || 'sesion')}</span><span style="width:170px;color:var(--gris)">${esc(p.valor || 'a8f3…')}</span>` +
    flags.map((f, i) => `<span style="flex:1;display:grid;place-items:center;position:relative;height:40px"><span style="color:#C5C9D8">—</span><span class="abs" style="inset:0;display:grid;place-items:center;background:#fff"${A(T(.55 + i * .35), { sfx: 'pop' })}><span style="width:34px;color:var(--verde);display:grid">${I.check}</span></span></span>`).join('') + `</div></div></div>`;
  flags.forEach((f, i) => { h += `<div class="pill gr" style="left:${90 + (i % 2) * 450}px;top:${590 + Math.floor(i / 2) * 76}px"${A(T(.55 + i * .35))}><b style="color:var(--tinta)">${esc(f.n)}</b>&nbsp;·&nbsp;${esc(f.d)}</div>`; });
  if (p.final !== false) h += pillC('no', p.final || 'Script ajeno: sin acceso', 800, T(.6 + flags.length * .35 + .2));
  return h;
};

// 10. Reloj de cuenta regresiva: el enlace que caduca
M.reloj = (p, c) => {
  const { T } = c, ini = p.desde ?? 900;
  let h = `<div class="card" style="left:150px;top:0;width:780px"${A(0)}><div class="body"><div style="display:flex;gap:16px;align-items:center"><span style="width:44px;color:var(--acento);display:grid">${I.correo}</span>` +
    `<div><div style="font-weight:800;font-size:30px">${esc(p.titulo || 'Restablece tu contraseña')}</div><div style="font-size:20px;color:var(--gris);margin-top:2px">${esc(p.sub || 'para ana@ejemplo.com')}</div></div></div>` +
    `<div class="fila" style="margin-top:20px;gap:14px"><div class="boton" style="margin:0;flex:1">${esc(p.boton || 'Elegir contraseña nueva')}</div><div class="pill az" style="position:static">${I.reloj}${esc(p.vigencia || 'Válido 15 min')}</div></div></div></div>`;
  h += `<div class="abs" style="left:380px;top:300px;width:320px;height:320px;border-radius:50%;background:conic-gradient(var(--acento) calc((1 - var(--p)) * 360deg), #E3E6F2 0)"${A(T(.15), { a: [T(.3), T(1.7)] })}>` +
    `<div class="abs" style="inset:22px;border-radius:50%;background:#fff;display:grid;place-items:center;box-shadow:var(--sombra)"><span class="mono" style="font-size:72px;font-weight:700"${A(T(.15), { a: [T(.3), T(1.7)] })} data-cuenta="${ini},0">${Math.floor(ini / 60)}:${String(ini % 60).padStart(2, '0')}</span></div></div>`;
  h += pillC('no', p.final || 'Enlace caducado', 700, T(1.75), 'golpe');
  return h;
};

// 11. Dos tarjetas con flecha y sello ✓/✕ (la buena pasa, la falsa se rechaza)
M.flujo = (p, c) => {
  const { T } = c, a = p.a || { url: c.dominio, titulo: 'Cambiar email', tag: 'token 9f2c…', ok: true }, b = p.b || { url: 'otro-sitio.example', titulo: 'Formulario oculto', tag: 'sin token', ok: false };
  const card = (o, x) => nav(o.url, x, 60, 440, `<div style="font-weight:800;font-size:28px">${esc(o.titulo)}</div><div class="tag ${o.ok ? 'ok' : 'no'}" style="position:static;display:inline-block;margin-top:14px">${o.ok ? '✓' : '✕'} ${esc(o.tag)}</div>`, 0);
  let h = card(a, 60) + card(b, 580);
  h += chip(p.destino || 'Tu servidor', 390, 610, 300, T(.2), null, null);
  h += linea(280, 300, 470, 610, T(.4), T(.95), { ocultar: T(.95) });
  h += sello(a.ok, 470, 560, T(1.0));
  h += linea(800, 300, 610, 610, T(1.0), T(1.5), { punteada: !b.ok, corta: b.ok ? 1 : .5, colorPunto: b.ok ? null : 'var(--rojo)' });
  h += sello(b.ok, b.ok ? 610 : 705, b.ok ? 560 : 455, T(1.55));
  if (p.nota) h += pillC(p.nota.ok ? 'ok' : 'no', p.nota.txt || p.nota, 860, T(1.85), null);
  return h;
};

// 12. Chat de WhatsApp: los mensajes entran uno a uno, planos como la app real
M.whatsapp = (p, c) => {
  const { T } = c, msgs = p.mensajes || [{ de: 'ella', txt: 'Hola, ¿tienen turno mañana?', hora: '9:41' }, { de: 'yo', txt: 'Sí: 10:00 o 16:30', hora: '9:41' }];
  const paso = Math.min(.5, 1.6 / msgs.length);
  let h = `<div class="card" style="left:150px;top:0;width:780px;${p.alto ? `height:${p.alto}px` : 'min-height:560px'};background:#EFEAE2"${A(0)}>` +
    `<div style="height:96px;background:#fff;display:flex;align-items:center;gap:16px;padding:0 24px;border-bottom:1px solid var(--linea)"><div style="width:58px;height:58px;border-radius:50%;background:#DDE1EE;display:grid;place-items:center;font-weight:800;font-size:24px;color:#545A73">${esc((p.contacto || 'Cliente')[0])}</div>` +
    `<div><div style="font-weight:700;font-size:28px">${esc(p.contacto || 'Cliente')}</div><div style="font-size:20px;color:var(--gris)">${esc(p.estado || 'en línea')}</div></div></div><div style="padding:24px 26px;display:flex;flex-direction:column;gap:14px">` +
    msgs.map((m, i) => { const yo = m.de === 'yo';
      return `<div style="align-self:${yo ? 'flex-end' : 'flex-start'};max-width:78%;background:${yo ? '#D9FDD3' : '#fff'};border-radius:16px;padding:14px 18px 10px;font-size:27px;line-height:1.3;box-shadow:0 1px 1px rgba(0,0,0,.08)"${A(T(.25 + i * paso), { sfx: 'pop' })}>` +
        `${esc(m.txt)}<div style="text-align:right;font-size:17px;color:#7A8290;margin-top:4px">${esc(m.hora || '')}${yo ? ' <span style="color:#53BDEB">✓✓</span>' : ''}</div></div>`; }).join('') + `</div></div>`;
  return h;
};

// 13. Calendario / horarios: los bloques se llenan en la semana
M.calendario = (p, c) => {
  const { T } = c, dias = p.dias || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], horas = p.horas || ['9:00', '11:00', '13:00', '15:00', '17:00'];
  const bloques = p.bloques || [{ dia: 0, hora: 0, txt: 'Grabar' }, { dia: 1, hora: 2, txt: 'Editar' }, { dia: 3, hora: 1, txt: 'Publicar', color: 'ok' }];
  const x0 = 200, cw = (960 - x0) / dias.length, y0 = 150, rh = 120;
  let h = `<div class="card" style="left:70px;top:0;width:940px;height:${y0 + horas.length * rh + 40}px"${A(0)}><div class="body"><div class="fila"><div class="lbl" style="display:flex;gap:10px;align-items:center"><span style="width:24px;display:grid">${I.calendario}</span>${esc(p.titulo || 'Esta semana')}</div>${p.pill ? `<div class="pill az" style="position:static;font-size:19px">${esc(p.pill)}</div>` : ''}</div></div>` +
    dias.map((d, i) => `<div class="abs lbl" style="left:${x0 - 70 + i * cw}px;top:100px;width:${cw}px;text-align:center">${esc(d)}</div>`).join('') +
    horas.map((hh, j) => `<div class="abs mono" style="left:24px;top:${y0 + j * rh + 8}px;font-size:20px;color:var(--gris)">${esc(hh)}</div><div class="abs" style="left:110px;right:20px;top:${y0 + j * rh}px;border-top:1px solid var(--linea)"></div>`).join('') +
    bloques.map((b, i) => { const col = b.color === 'ok' ? ['var(--verde-bg)', 'var(--verde)'] : b.color === 'no' ? ['var(--rojo-bg)', 'var(--rojo)'] : ['#E9EBFF', 'var(--acento)'];
      return `<div class="abs" style="left:${x0 - 64 + b.dia * cw}px;top:${y0 + b.hora * rh + 8}px;width:${cw - 12}px;height:${rh * (b.largo || 1) - 16}px;border-radius:12px;background:${col[0]};border-left:6px solid ${col[1]};padding:10px 10px;font-weight:700;font-size:21px;color:${col[1]};overflow:hidden"${A(T(.3 + i * Math.min(.35, 1.6 / bloques.length)), { sfx: 'pop' })}>${esc(b.txt)}</div>`; }).join('') + `</div>`;
  return h;
};

// 14. Barra de límite: se llena, y la petición de más se rechaza
M.limite = (p, c) => {
  const { T } = c, n = p.max || 5;
  let h = `<div class="card" style="left:170px;top:120px;width:740px"${A(0)}><div class="body"><div class="fila"><div style="font-weight:800;font-size:30px">${esc(p.titulo || 'Límite de peticiones')}</div><div class="pill az" style="position:static;font-size:20px">${esc(p.ritmo || n + ' por segundo')}</div></div>` +
    `<div style="display:flex;gap:12px;margin-top:22px">${Array.from({ length: n }, (_, i) => `<div style="flex:1;height:22px;border-radius:11px;background:#E3E6F2;position:relative;overflow:hidden"><div class="abs" style="inset:0;background:${i === n - 1 ? 'var(--rojo)' : '#F5A524'}"${A(T(.2 + i * (1 / n)), { sfx: i === n - 1 ? null : null })}></div></div>`).join('')}</div></div></div>`;
  h += pillC('no', p.bloqueo || '429 · más despacio', 380, T(1.35), 'golpe');
  h += chip(p.destino || 'Tu API', 390, 520, 300, T(.1), null, null, 'rayo');
  h += linea(540, 270, 540, 520, T(.2), T(1.2), { punto: true, sfx: null });
  return h;
};

// 15. Checklist: los puntos se tachan uno a uno (pasos de un tutorial)
M.lista = (p, c) => {
  const { T } = c, items = p.items || ['Paso uno', 'Paso dos', 'Paso tres'];
  const paso = Math.min(.4, 1.6 / items.length);
  return `<div class="card" style="left:130px;top:40px;width:820px"${A(0)}><div class="body">${p.etiqueta ? `<div class="lbl" style="margin-bottom:6px">${esc(p.etiqueta)}</div>` : ''}` +
    items.map((it, i) => `<div style="display:flex;gap:18px;align-items:center;padding:18px 4px;border-top:${i ? '1px solid var(--linea)' : 'none'}">` +
      `<span style="position:relative;width:44px;height:44px;border-radius:12px;border:3px solid #D7DAE6;display:grid;place-items:center"><span class="abs" style="inset:-3px;border-radius:12px;background:var(--verde);color:#fff;display:grid;place-items:center;padding:6px"${A(T(.3 + i * paso), { sfx: 'pop' })}>${I.check}</span></span>` +
      `<span style="font-weight:700;font-size:30px">${esc(it)}</span></div>`).join('') + `</div></div>`;
};

// 16. Cierre: seguir + comentar la palabra
M.cierre = (p, c) => {
  const { T } = c;
  let h = `<div class="card" style="left:170px;top:20px;width:740px"${A(0)}><div class="body fila"><div style="display:flex;gap:16px;align-items:center"><div class="ava" style="width:76px;height:76px;border-radius:50%;background:var(--tinta);color:#fff;display:grid;place-items:center;font-weight:800;font-size:32px;overflow:hidden">${c.foto ? `<img src="${esc(c.foto)}" style="width:100%;height:100%;object-fit:cover">` : esc((c.handle || '@').replace('@', '')[0] || '@').toUpperCase()}</div>` +
    `<div><div style="font-weight:800;font-size:30px">${esc(c.handle)}</div><div style="font-size:20px;color:var(--gris)">${esc(p.bio || '')}</div></div></div>` +
    `<div style="position:relative"><div class="boton" style="margin:0;padding:0 28px;height:58px">Seguir</div><div class="boton abs" style="margin:0;inset:0;background:var(--gris-claro);color:var(--tinta);font-size:22px"${A(T(.6), { sfx: 'pop' })}>✓ Siguiendo</div></div></div></div>`;
  h += `<div class="card" style="left:110px;top:200px;width:860px"${A(T(.3))}><div class="body fila" style="gap:18px"><div style="width:62px;height:62px;border-radius:50%;background:#B8BDD0;color:#fff;display:grid;place-items:center;padding:14px">${I.usuario}</div>` +
    `<div style="flex:1;height:96px;border-radius:16px;background:#F1F2F8;display:flex;align-items:center;padding:0 22px;position:relative"><span style="font-size:26px;color:var(--gris)">Añade un comentario…</span>` +
    `<span class="abs" style="inset:0;border-radius:16px;background:#F1F2F8;display:flex;align-items:center;padding:0 22px;font-weight:900;font-size:62px;letter-spacing:-.02em;color:var(--acento)"${A(T(.9), { sfx: 'golpe' })}>${esc(p.palabra || 'PALABRA')}</span></div>` +
    `<div style="width:76px;height:76px;border-radius:18px;background:var(--acento);color:#fff;display:grid;place-items:center;padding:18px">${I.enviar}</div></div></div>`;
  if (p.regalo) h += `<div class="card" style="left:200px;top:400px;width:680px"${A(T(1.3))}><div class="body" style="text-align:center"><div class="lbl">${esc(p.regalo_etiqueta || 'Te llega por mensaje')}</div><div style="font-weight:800;font-size:32px;margin-top:10px">${esc(p.regalo)}</div></div></div>`;
  return h;
};

// Mascota propia opcional (pixel, plana, sin rebote): un escudito con ojos
M.mascota = (p, c) => {
  const patron = ['..XXXXX..', '.XXXXXXX.', 'XXoXXXoXX', 'XXoXXXoXX', 'XXXXXXXXX', '.XXX.XXX.', '..XXXXX..', '...XXX...'];
  const s = p.px || 16, col = p.color || 'var(--acento)';
  return `<div class="abs" style="left:${p.x}px;top:${p.y}px;width:${9 * s}px;height:${8 * s}px"${A(0)}>` +
    patron.map((r, y) => [...r].map((ch, x) => ch === '.' ? '' : `<i class="abs" style="left:${x * s}px;top:${y * s}px;width:${s}px;height:${s}px;background:${ch === 'o' ? '#fff' : col}"></i>`).join('')).join('') + `</div>`;
};

// Escape: HTML propio con los mismos atributos data-t / data-a
M.libre = (p) => p.html || '';

window.MAQUETAS = M;
window.MAQ_UTIL = { I, esc, A, nav, chip, pill, pillC, sello, linea };
})();
