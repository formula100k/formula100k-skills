/* Motor de la animación de recortes de papel.
   Lee window.CONFIG (config.js) y window.TIEMPOS (tiempos.js, lo escribe armar.mjs) y arma, de forma síncrona,
   el DOM de cada escena, los encabezados, los subtítulos palabra por palabra y UN timeline de GSAP.
   No se edita por pieza: todo lo que cambia vive en config.js. */
(function () {
  const C = window.CONFIG, TI = window.TIEMPOS;
  const root = document.getElementById("root");
  const DUR = TI.dur, T = TI.cortes;
  const tema = C.tema || {};
  Object.keys(tema).forEach((k) => root.style.setProperty("--" + k, tema[k]));

  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });

  /* ── utilidades ── */
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const marca = (s) => esc(s).replace(/\*([^*]+)\*/g, '<span class="hl">$1</span>').replace(/_([^_]+)_/g, '<span class="serif">$1</span>');
  const color = (c, def) => { c = c || def; return /^(#|rgb)/.test(c) ? c : "var(--" + c + ")"; };
  const el = (cls, parent, style, html) => {
    const e = document.createElement("div"); if (cls) e.className = cls;
    if (style) e.style.cssText = style; if (html != null) e.innerHTML = html; parent.appendChild(e); return e;
  };
  // envoltura posicionada y escalada (estática) + interior que se anima
  const pz = (ctx, o, w, h, x, y) => {
    const k = o.escala || 1, r = o.rot || 0;
    const p = el("pz", ctx.esc, `left:${o.x != null ? o.x : x}px;top:${o.y != null ? o.y : y}px;width:${w}px;height:${h}px;transform:scale(${k}) rotate(${r}deg)`);
    return el("in", p);
  };
  const cabe = (n, max, ancho, factor) => Math.max(18, Math.min(max, Math.floor(ancho / (Math.max(1, n) * (factor || 0.62)))));

  /* ── movimientos (a saltos, como recorte de papel) ── */
  const pop = (e, t, d) => tl.fromTo(e, { scale: 0 }, { scale: 1, duration: d || 0.22, ease: "back.out(2.6)" }, t);
  const sube = (e, t, dist) => tl.fromTo(e, { y: dist || 1300 }, { y: 0, duration: 0.4, ease: "steps(5)" }, t);
  const cae = (e, t, rot) => tl.fromTo(e, { y: -1400, rotation: (rot || 0) - 6 }, { y: 0, rotation: rot || 0, duration: 0.34, ease: "steps(5)" }, t);
  const lado = (e, t, dx) => tl.fromTo(e, { x: dx }, { x: 0, duration: 0.3, ease: "steps(4)" }, t);
  const golpe = (e, t, rot) => tl.fromTo(e, { scale: 3, opacity: 0, rotation: rot }, { scale: 1, opacity: 1, rotation: rot, duration: 0.16, ease: "power4.in" }, t);
  const salto = (e, t, s) => tl.fromTo(e, { scale: 1 }, { scale: s || 1.1, duration: 0.14, ease: "steps(2)", repeat: 1, yoyo: true, immediateRender: false }, t);
  const menea = (e, t, hasta, a) => {
    const n = Math.max(1, Math.floor((hasta - t) / 0.34) - 1);
    tl.fromTo(e, { rotation: -(a || 3) }, { rotation: a || 3, duration: 0.34, ease: "steps(2)", repeat: n, yoyo: true, immediateRender: false }, t);
  };
  const entra = (e, modo, t, rot) => {
    if (modo === "sube") sube(e, t); else if (modo === "cae") cae(e, t, rot);
    else if (modo === "izq") lado(e, t, -1200); else if (modo === "der") lado(e, t, 1200);
    else if (modo !== "fija") pop(e, t);
  };

  /* ── piezas ── */
  // Mascotas pixel (mascotas.js). Cada personaje se dibuja con lo que representa: `lleva` le pone el objeto en la mano.
  const HEX = Object.assign({ blanco: "#FFFDF7", salvia: "#B9CFA8", rosa: "#F3B6C4", azul: "#BFD0F5", kraft: "#C9A77A", acento: "#F4D35E" }, tema);
  const hex = (c) => (!c ? null : /^#/.test(c) ? c : HEX[c] || null);
  const PEGATINA = "filter:drop-shadow(.05em 0 0 #fff) drop-shadow(-.05em 0 0 #fff) drop-shadow(0 .05em 0 #fff) drop-shadow(0 -.05em 0 #fff) drop-shadow(0 .1em .12em rgba(0,0,0,.3))";
  // pinta la mascota dentro de `cont`; mira:"izq" la voltea sobre el eje del cuerpo (el objeto queda del otro lado)
  const mascota = (cont, nombre, o) => {
    const m = window.MASCOTA(nombre, Object.assign({ acento: HEX.acento }, o)); cont.innerHTML = m.svg;
    if (o.mira === "izq") { const s = cont.firstChild; s.style.transformOrigin = (50 * m.bw / m.w) + "% 50%"; s.style.transform = "scaleX(-1)"; }
    return m;
  };
  const parpadea = (cont, ctx) => {
    for (let b = ctx.t0 + 1.5; b < ctx.t1 - 0.3; b += 3.1) tl.to(cont.querySelectorAll(".mo"), { scaleY: 0.15, transformOrigin: "50% 50%", duration: 0.06, repeat: 1, yoyo: true }, b);
  };

  const P = {
    // El protagonista: tu contenido, un reel pixel. { x, y, tam, en, mira:"izq"|"der", quieto, color, lleva:"iman"|"regadera"|"bolsa" }
    personaje(ctx, o) {
      const tam = o.tam || 100, t = ctx.cuando(o.en, 0.2);
      const i = pz(ctx, o, tam * 2.2, tam * 3.3, 430, 700);
      const r = el("reli", i, `font-size:${tam}px`);
      mascota(r, "reel", { lleva: o.lleva, mira: o.mira, color: hex(o.color) });
      sube(i, t, 1100);
      if (!o.quieto) menea(i, t + 0.45, ctx.t1, 3);
      parpadea(r, ctx);
    },
    // Gente pixel. modo: "pasan" | "llega" | "fila" | "cliente" · { v (variante 0–4), color (ropa), lleva:"moneda"|"bolsa", mira }
    gente(ctx, o) {
      const modo = o.modo || "cliente";
      const gen = (i, tam, v, mira) => { const g = el("gen", i, `font-size:${tam}px;${PEGATINA}`); mascota(g, "persona", { v: o.v != null ? o.v : v, ropa: hex(o.color), lleva: o.lleva, mira: mira || o.mira }); return g; };
      if (modo === "pasan") {
        const n = o.n || 2, tam = o.tam || 120;
        for (let j = 0; j < n; j++) {
          const i = pz(ctx, { x: 0, y: (o.y != null ? o.y : 1010) + j * 48 }, tam * 1.3, tam * 1.95);
          const der = j % 2 === 0; gen(i, tam, j + 1, der ? "der" : "izq");
          const t = ctx.t0 + 0.25 + j * 0.65, d = Math.max(0.6, Math.min(2.1, ctx.t1 - t - 0.05));
          tl.fromTo(i, { x: der ? -260 : 1140 }, { x: der ? 1140 : -260, duration: d, ease: "steps(14)" }, t);
        }
      } else if (modo === "llega") {
        const tam = o.tam || 140, x = o.x != null ? o.x : 110, y = o.y != null ? o.y : 1030;
        const tp = ctx.cuando(o.en, (ctx.t1 - ctx.t0) * 0.7);
        const i = pz(ctx, { x: 0, y: y }, tam * 1.3, tam * 1.95);
        const g = gen(i, tam, 0);
        const d = Math.max(0.3, Math.min(1.25, tp - ctx.t0 - 0.1));
        tl.fromTo(i, { x: -260 }, { x: x, duration: d, ease: "steps(9)" }, tp - d);
        salto(g, tp, 1.14);
        if (!o.sinSigno) {
          const s = el("rot", ctx.esc, `left:${x + tam * 0.1}px;top:${y - tam * 1.3}px;width:${tam}px;font-size:${tam * 1.1}px;color:var(--rojo);text-shadow:6px 0 0 #fff,-6px 0 0 #fff,0 6px 0 #fff,0 -6px 0 #fff`, "!");
          pop(s, tp + 0.02);
        }
      } else {
        const n = modo === "fila" ? (o.n || 5) : 1, tam = o.tam || (modo === "fila" ? 104 : 190);
        const x = o.x != null ? o.x : (modo === "fila" ? 20 : 170), y = o.y != null ? o.y : (modo === "fila" ? 1000 : 760);
        const sep = o.sep || tam * 1.25, t = ctx.cuando(o.en, modo === "fila" ? 0.5 : 0.22);
        for (let j = 0; j < n; j++) {
          const i = pz(ctx, { x: x + j * sep, y: y + (j % 2) * 40 }, tam * 1.3, tam * 1.95);
          const g = gen(i, tam, j); parpadea(g, ctx);
          tl.fromTo(i, { y: 1100 }, { y: 0, duration: 0.3, ease: "steps(4)" }, t + j * 0.16);
          if (o.asiente != null) menea(g, ctx.cuando(o.asiente, 2), Math.min(ctx.t1, ctx.cuando(o.asiente, 2) + 1), 3);
        }
      }
    },
    // Mascota u objeto pixel suelto. { sprite:"corazon"|"iman"|"regadera"|"bolsa"|"moneda"|"reel"|"persona", alto, x, y, en, rot, entrada, mece }
    mascota(ctx, o) {
      const h = o.alto || 160, m = window.MASCOTA(o.sprite, o); if (!m) { console.warn("Mascota desconocida: " + o.sprite); return; }
      const i = pz(ctx, o, h * m.w / m.h, h, 400, 600);
      const c = el("abs", i, `inset:0;font-size:${h}px;${PEGATINA}`); mascota(c, o.sprite, o);
      const t = ctx.cuando(o.en, 0.3); entra(i, o.entrada || "pop", t, o.rot);
      if (o.mece) menea(c, t + 0.3, ctx.t1, 5);
    },
    // Fachada con toldo. { x, y, ancho, alto, en }
    tienda(ctx, o) {
      const w = o.ancho || 860, h = o.alto || 760, i = pz(ctx, o, w, h, 110, 520);
      el("pp", i, `left:30px;top:90px;width:${w - 60}px;height:${h - 90}px;background:var(--kraft)`);
      el("pp", i, `left:0;top:0;width:${w}px;height:130px;border-radius:10px 10px 40px 40px;background:repeating-linear-gradient(90deg,var(--tinta) 0 86px,var(--blanco) 86px 172px)`);
      tl.fromTo(i, { y: 1500 }, { y: 0, duration: 0.4, ease: "steps(5)" }, ctx.cuando(o.en, 0.05));
    },
    // Tarjetas numeradas. { n, x, y, ancho, alto, sep, en, apagados:[2,3], apagaEn, etiquetas:[…], saltaEn }
    numeros(ctx, o) {
      const n = o.n || 3, w = o.ancho || 230, h = o.alto || 330, sep = o.sep != null ? o.sep : 25;
      const x = o.x != null ? o.x : Math.round((1080 - n * w - (n - 1) * sep) / 2), y = o.y != null ? o.y : 700;
      const t = ctx.cuando(o.en, 0.9), ta = ctx.cuando(o.apagaEn, (ctx.t1 - ctx.t0) * 0.72), cajas = [];
      for (let j = 0; j < n; j++) {
        const i = pz(ctx, { x: x + j * (w + sep), y: y, rot: [-2, 1.5, -1.5, 2][j % 4] }, w, h);
        el("num", i, `inset:0;font-size:${Math.round(h * 0.6)}px`, String(o.desde != null ? o.desde + j : j + 1));
        pop(i, t + j * 0.13); cajas.push(i);
        if ((o.apagados || []).includes(j + 1)) {
          const d = el("abs", i, "inset:0;border-radius:14px;background:rgba(27,26,23,.82)");
          const z = el("rot serif", i, `left:0;width:100%;top:${h * 0.28}px;font-size:${Math.round(h * 0.36)}px;color:var(--papel)`, "zzz");
          tl.set([d, z], { opacity: 0 }, 0); tl.set(d, { opacity: 1 }, ta); tl.set(z, { opacity: 1 }, ta + 0.14 * (j + 1));
        }
        if (o.etiquetas && o.etiquetas[j]) {
          const txt = o.etiquetas[j], l = el("rot", ctx.esc, `left:${x + j * (w + sep) - 20}px;width:${w + 40}px;top:${y + h + (o.etiquetaY != null ? o.etiquetaY : 40)}px;font-size:${cabe(txt.length, 50, w + 40)}px`, esc(txt));
          tl.fromTo(l, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.14, ease: "power2.out" }, t + 0.2 + j * 0.08);
        }
      }
      if (o.saltaEn != null) tl.to(cajas.filter((c, j) => !(o.apagados || []).includes(j + 1)), { scale: 1.07, duration: 0.14, ease: "steps(2)", repeat: 1, yoyo: true, stagger: 0.06 }, ctx.cuando(o.saltaEn, 1.5));
    },
    // Vitrina con rayos. { x, y, ancho, alto, marco, rayos:false, pedestal:false, en }
    vitrina(ctx, o) {
      const w = o.ancho || 650, h = o.alto || 700, i = pz(ctx, o, w, h, 215, 450);
      el("pp", i, `inset:0;background:${color(o.marco, "tinta")};border-radius:16px`);
      const v = el("abs", i, `left:34px;top:34px;width:${w - 68}px;height:${h - 68}px;background:var(--luz);overflow:hidden;border-radius:6px`);
      if (o.rayos !== false) {
        const r = el("abs", v, `left:${(w - 68) / 2 - 500}px;top:${(h - 68) / 2 - 500}px;width:1000px;height:1000px;border-radius:50%;opacity:.75;background:repeating-conic-gradient(var(--acento) 0 15deg,transparent 15deg 30deg)`);
        tl.fromTo(r, { rotation: 0 }, { rotation: 50, duration: ctx.t1 - ctx.t0, ease: "steps(18)" }, ctx.t0);
      }
      if (o.pedestal !== false) el("abs", v, `left:${(w - 68) / 2 - 120}px;top:${h - 68 - 92}px;width:240px;height:92px;background:var(--kraft2)`);
      tl.fromTo(i, { scale: 0.2, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.3, ease: "back.out(1.6)" }, ctx.cuando(o.en, 0.04));
    },
    // Mostrador a todo lo ancho. { y, en }
    mostrador(ctx, o) {
      const i = pz(ctx, { x: 0, y: o.y != null ? o.y : 1030 }, 1080, 270);
      el("pp", i, "left:0;top:36px;width:1080px;height:234px;background:var(--kraft)");
      el("pp", i, "left:-10px;top:0;width:1100px;height:56px;background:var(--kraft2)");
      tl.fromTo(i, { y: 500 }, { y: 0, duration: 0.3, ease: "steps(4)" }, ctx.cuando(o.en, 0.04));
    },
    // Franja de piso, estática. { y, color }
    piso(ctx, o) { el("pp", ctx.esc, `left:0;top:${o.y != null ? o.y : 1150}px;width:1080px;height:800px;background:${color(o.color, "papel2")}`); },
    // Medidor que se llena. { x, y, etiqueta, segmentos, desde, hasta, en }
    medidor(ctx, o) {
      const n = o.segmentos || 5, w = 520, i = pz(ctx, o, w, 150, 90, 470), sw = (w - 36 - (n - 1) * 10) / n;
      el("rot", i, "left:0;top:0;font-size:38px;letter-spacing:.16em", esc(o.etiqueta || ""));
      el("pp", i, `left:0;top:56px;width:${w}px;height:86px;background:var(--blanco);border:8px solid var(--tinta);border-radius:12px`);
      lado(i, ctx.cuando(o.en, 0.5), -700);
      const ta = ctx.cuando(o.desde, (ctx.t1 - ctx.t0) * 0.4), tb = Math.max(ta + 0.2, ctx.cuando(o.hasta, (ctx.t1 - ctx.t0) * 0.85));
      for (let j = 0; j < n; j++) {
        const s = el("abs", i, `left:${18 + j * (sw + 10)}px;top:74px;width:${sw}px;height:50px;background:var(--acento)`);
        tl.set(s, { opacity: 0 }, 0); tl.set(s, { opacity: 1 }, ta + (tb - ta) * (n > 1 ? j / (n - 1) : 1));
      }
      salto(i, tb + 0.02, 1.08);
    },
    // Fichas de papel que viajan de un punto a otro. { de:[x,y], a:[x,y], n, desde, hasta }
    fichas(ctx, o) {
      const n = o.n || 3, de = o.de || [700, 820], a = o.a || [280, 810];
      const ta = ctx.cuando(o.desde, (ctx.t1 - ctx.t0) * 0.35), tb = Math.max(ta + 0.3, ctx.cuando(o.hasta, (ctx.t1 - ctx.t0) * 0.7));
      for (let j = 0; j < n; j++) {
        const t = ta + (tb - ta) * (n > 1 ? j / (n - 1) : 0);
        const f = el("pp", ctx.esc, `left:${de[0]}px;top:${de[1]}px;width:150px;height:190px;background-color:var(--blanco);border-radius:8px;background-image:repeating-linear-gradient(180deg,transparent 0 30px,var(--gris) 30px 38px);background-size:100px 100%;background-position:25px 14px;background-repeat:no-repeat`);
        tl.fromTo(f, { scale: 0, x: 0, y: 0, rotation: 8 }, { scale: 1, x: 0, y: 0, rotation: 8, duration: 0.14, ease: "back.out(2)" }, t);
        tl.to(f, { x: a[0] - de[0], y: a[1] - de[1], rotation: -12, duration: 0.34, ease: "steps(5)" }, t + 0.14);
        tl.to(f, { scale: 0, duration: 0.1, ease: "power2.in" }, t + 0.48);
      }
    },
    // Caja registradora. { x, y, pantalla, pantallaEn, cajonEn, apagada, en }
    caja(ctx, o) {
      const off = !!o.apagada, cu = off ? "#4A4038" : "var(--tinta)";
      const i = pz(ctx, o, 580, 640, 250, 560);
      if (o.cajonEn != null && !off) {
        const c = el("pp", i, "left:20px;top:510px;width:540px;height:110px;background:var(--kraft2);border:10px solid var(--tinta);border-radius:0 0 14px 14px");
        [50, 218, 386].forEach((x, j) => el("abs", c, `left:${x}px;top:${j === 1 ? -44 : -34}px;width:84px;height:84px;border-radius:50%;background:var(--acento);border:8px solid var(--tinta)`));
        tl.fromTo(c, { y: -110 }, { y: 0, duration: 0.22, ease: "steps(3)" }, ctx.cuando(o.cajonEn, 2.8));
      }
      el("pp", i, `left:60px;top:0;width:460px;height:170px;background:${cu};border-radius:16px 16px 0 0`);
      const p = el("abs", i, `left:84px;top:24px;width:412px;height:122px;background:${off ? "#6F665A" : "var(--luz)"};border-radius:8px;display:grid;place-items:center`);
      if (o.pantalla && !off) {
        const d = el("", p, `font-weight:900;font-size:${cabe(o.pantalla.length, 58, 380)}px;letter-spacing:-.02em;white-space:nowrap`, esc(o.pantalla));
        const tp = ctx.cuando(o.pantallaEn, 1.2);
        tl.set(d, { opacity: 0 }, 0); tl.set(d, { opacity: 1 }, tp);
        tl.fromTo(d, { scale: 0.6 }, { scale: 1, duration: 0.2, ease: "back.out(3)" }, tp);
      }
      el("pp", i, `left:0;top:170px;width:580px;height:370px;background:${cu};border-radius:14px`);
      if (!off) el("abs", i, "left:40px;top:210px;width:500px;height:290px;background-color:var(--papel);background-image:linear-gradient(var(--tinta) 22px,transparent 22px),linear-gradient(90deg,var(--tinta) 22px,transparent 22px);background-size:100px 96px");
      const t = ctx.cuando(o.en, 0.04);
      if (off) lado(i, t, 900); else { cae(i, t, 0); menea(i, t + 0.36, t + 1.1, 2); tl.to(i, { rotation: 0, duration: 0.01 }, t + 1.12); }
    },
    // Etiqueta de papel con texto. { x, y, texto, tam, en, rot, mece }
    etiqueta(ctx, o) {
      const i = pz(ctx, o, 10, 10, 600, 420);
      const e = el("tag pp", i, `font-size:${o.tam || 44}px`, marca(o.texto || ""));
      const t = ctx.cuando(o.en, 1);
      pop(e, t); if (o.mece) menea(e, t + 0.3, Math.min(ctx.t1, t + 1.6), 5);
    },
    // Sello que cae de golpe. { x, y, texto, tam, en, rot }
    sello(ctx, o) {
      const i = pz(ctx, { x: o.x, y: o.y }, 10, 10, 300, 800);
      golpe(el("sello", i, `font-size:${o.tam || 80}px`, esc(o.texto || "")), ctx.cuando(o.en, 2.5), o.rot != null ? o.rot : -9);
    },
    // Ojos (vistas) que saltan. { x, y, n, sep, en }
    ojos(ctx, o) {
      const n = o.n || 5, x = o.x != null ? o.x : 60, y = o.y != null ? o.y : 900, sep = o.sep || 130, t = ctx.cuando(o.en, 2);
      for (let j = 0; j < n; j++) {
        const e = el("ojoV", ctx.esc, `left:${x + j * sep}px;top:${y + (j % 2) * 32}px`);
        tl.fromTo(e, { scale: 0, y: 0 }, { scale: 1, y: -70, duration: 0.2, ease: "back.out(3)" }, t + j * 0.07);
      }
    },
    // Mini teléfonos que caen en columnas. { columnas:[x…], y, porColumna, en }
    minis(ctx, o) {
      const cols = o.columnas || [210, 540, 870], y = o.y != null ? o.y : 985, m = o.porColumna || 2, t = ctx.cuando(o.en, 0.5);
      let k = 0;
      for (let f = 0; f < m; f++) cols.forEach((cx) => {
        const e = el("mini", ctx.esc, `left:${cx - (m * 84 + (m - 1) * 32) / 2 + f * 116}px;top:${y}px`);
        tl.fromTo(e, { y: -1300, rotation: -20 }, { y: 0, rotation: k % 2 ? 5 : -5, duration: 0.26, ease: "steps(4)" }, t + k * 0.15); k++;
      });
    },
    // Tarjeta del regalo. { x, y, eyebrow, titulo, en }
    regalo(ctx, o) {
      const i = pz(ctx, o, 820, 330, 130, 440);
      const c = el("pp", i, "inset:0;background:var(--blanco);padding:44px 50px");
      el("", c, "font-weight:800;font-size:30px;letter-spacing:.2em;color:var(--gris);text-transform:uppercase", esc(o.eyebrow || ""));
      el("", c, `font-weight:900;font-size:${cabe((o.titulo || "").replace(/[*_]/g, "").length, 76, 820 * 2.1, 0.55)}px;letter-spacing:-.045em;line-height:.98;margin-top:14px`, marca(o.titulo || ""));
      el("abs", c, "left:300px;top:-26px;width:220px;height:52px;background:var(--acento);opacity:.85;transform:rotate(-3deg)");
      const t = ctx.cuando(o.en, 0.05);
      tl.fromTo(i, { y: -900, rotation: -9 }, { y: 0, rotation: -3, duration: 0.36, ease: "back.out(1.3)" }, t);
    },
    // Caja de comentario donde se escribe la palabra. { y, palabra, placeholder, boton, en, escribeEn }
    comentario(ctx, o) {
      const pal = o.palabra || "", i = pz(ctx, { x: 70, y: o.y != null ? o.y : 860 }, 940, 150);
      const c = el("pp", i, "inset:0;background:#fff;border-radius:75px");
      el("abs", c, "left:24px;top:24px;width:102px;height:102px;border-radius:50%;background:var(--tinta)");
      const ph = el("abs", c, "left:156px;top:50px;font-size:44px;color:#A79F93;white-space:nowrap", esc(o.placeholder || "Agrega un comentario…"));
      const tx = el("abs", c, `left:156px;top:26px;font-weight:900;font-size:${cabe(pal.length, 84, 560, 0.7)}px;line-height:98px;letter-spacing:.02em;white-space:nowrap`, pal.split("").map((l) => `<span>${esc(l)}</span>`).join(""));
      el("abs", c, "right:44px;top:50px;font-weight:800;font-size:42px;color:var(--gris)", esc(o.boton || "Publicar"));
      pop(i, ctx.cuando(o.en, 0.9), 0.24);
      const te = ctx.cuando(o.escribeEn != null ? o.escribeEn : pal, Math.max(1.2, ctx.t1 - ctx.t0 - 2.4), true);
      tl.set(Array.from(tx.children), { opacity: 0 }, 0); tl.set(ph, { opacity: 0 }, te - 0.04);
      Array.from(tx.children).forEach((s, j) => tl.set(s, { opacity: 1 }, te + j * 0.11));
      const tf = te + pal.length * 0.11 + 0.1;
      if (tf < ctx.t1 - 0.3) tl.fromTo(i, { scale: 1 }, { scale: 1.05, duration: 0.14, ease: "steps(2)", repeat: 3, yoyo: true, immediateRender: false }, tf);
    },
    // Lista con casillas que se marcan. { x, y, ancho, items:[{texto, en}] }
    lista(ctx, o) {
      const w = o.ancho || 820, items = o.items || [], x = o.x != null ? o.x : 130, y = o.y != null ? o.y : 480;
      items.forEach((it, j) => {
        const i = pz(ctx, { x: x, y: y + j * 150, rot: j % 2 ? 1 : -1 }, w, 118);
        const f = el("fila pp", i, `font-size:${cabe(it.texto.replace(/[*_]/g, "").length, 52, w - 150, 0.6)}px`, `<i class="cas"><b class="ok">✓</b></i><span>${marca(it.texto)}</span>`);
        const t = ctx.cuando(it.en, 0.4 + j * 0.55);
        pop(f, t); golpe(f.querySelector(".ok"), t + 0.2, 0);
      });
    },
    // Globo de diálogo. { x, y, texto, tam, en, cola:"izq"|"der" }
    globo(ctx, o) {
      const i = pz(ctx, o, 10, 10, 200, 560);
      const g = el("globo pp", i, `font-size:${o.tam || 48}px`, marca(o.texto || "") + `<i style="${o.cola === "der" ? "right:60px" : "left:60px"}"></i>`);
      pop(g, ctx.cuando(o.en, 1.2));
    },
    // Texto suelto. { x, y, ancho, texto, tam, color, en }
    rotulo(ctx, o) {
      const r = el("rot", ctx.esc, `left:${o.x || 0}px;top:${o.y || 500}px;width:${o.ancho || 1080}px;font-size:${o.tam || 50}px;color:${color(o.color, "tinta")}`, marca(o.texto || ""));
      tl.fromTo(r, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.14, ease: "power2.out" }, ctx.cuando(o.en, 0.3));
    },
    // Foto o recorte propio (PNG sin fondo). { src, x, y, ancho, en, rot, entrada, sticker:false }
    imagen(ctx, o) {
      const w = o.ancho || 400, i = pz(ctx, o, w, w, 340, 600);
      const im = document.createElement("img"); im.src = o.src; im.alt = ""; im.id = "img-" + ctx.i + "-" + ctx.esc.children.length;
      im.style.cssText = `position:absolute;display:block;left:0;top:0;width:${w}px;height:auto`; if (o.sticker !== false) im.className = "sticker";
      i.appendChild(im); entra(i, o.entrada || "sube", ctx.cuando(o.en, 0.2));
    },
  };

  /* ── escenas ── */
  const cabs = document.getElementById("cabs"), subs = document.getElementById("subs");
  const grupos = [];
  C.escenas.forEach((E, i) => {
    const sec = document.getElementById("e" + i);
    sec.querySelector(".fondo").style.background = color(E.fondo, "papel");
    const pal = TI.palabras.filter((p) => p[2] === i);
    const ctx = {
      i, esc: sec.querySelector(".esc"), t0: T[i], t1: T[i + 1],
      // en: número = segundos desde el inicio de la escena · texto = cuando se dice esa palabra · vacío = def
      cuando(en, def, ultima) {
        let t;
        if (typeof en === "number") t = T[i] + en;
        else if (typeof en === "string" && en) {
          const k = norm(en), c = pal.filter((p) => norm(p[0]).indexOf(k) === 0);
          t = c.length ? (ultima ? c[c.length - 1][1] : c[0][1]) : T[i] + def;
        } else t = T[i] + def;
        return Math.max(T[i] + 0.01, Math.min(t, T[i + 1] - 0.25));
      },
    };
    (E.piezas || []).forEach((o) => {
      if (!P[o.tipo]) { console.warn("Pieza desconocida: " + o.tipo); return; }
      P[o.tipo](ctx, o);
    });
    if (i === C.escenas.length - 1 && C.usuario) el("usuario", ctx.esc, "", esc(C.usuario));

    // encabezado fijo de la escena
    if (E.encabezado) {
      const limpio = E.encabezado.replace(/[*_]/g, ""), rot = [-1.5, 1.2, -1, 1.5, -1.2, 1][i % 6];
      const c = el("cab", cabs, "", `<div class="tira"></div><i class="tape a"></i><i class="tape b"></i><div class="txt" style="font-size:${cabe(limpio.length, 50, 860, 0.66)}px">${marca(E.encabezado)}</div>`);
      tl.fromTo(c, { y: -420, rotation: rot - 6 }, { y: 0, rotation: rot, duration: 0.32, ease: "back.out(1.5)" }, T[i] + 0.02);
      if (i < C.escenas.length - 1) tl.set(c, { opacity: 0 }, T[i + 1]);
    }

    // subtítulos: corta en la puntuación o cada 3 palabras
    let g = [];
    const cierra = () => { if (g.length) { grupos.push(g); g = []; } };
    pal.forEach((p) => { g.push(p); if (/[,.:;!?…]$/.test(p[0]) || g.length === 3) cierra(); });
    cierra();
    const n = grupos.length;
    if (n > 1 && grupos[n - 1].length === 1 && grupos[n - 1][0][2] === grupos[n - 2][0][2] && grupos[n - 2].length < 4 &&
        !/[,.:;!?…]$/.test(grupos[n - 2][grupos[n - 2].length - 1][0]) &&
        grupos[n - 2].concat(grupos[n - 1]).map((p) => p[0]).join(" ").length <= 22) grupos[n - 2].push(grupos.pop()[0]);
  });
  const sy = (C.subtitulos && C.subtitulos.y) || 1352;
  grupos.forEach((g, gi) => {
    const d = el("grupo", subs, `top:${sy}px`);
    g.forEach((p, wi) => {
      const s = el("w" + (p[3] ? " k" : ""), d, "", esc(p[0])), rot = (gi + wi) % 2 ? 1.6 : -1.6;
      tl.fromTo(s, { scale: 0, rotation: rot * 4 }, { scale: 1, rotation: rot, duration: 0.12, ease: "back.out(2.5)" }, p[1]);
    });
    if (gi < grupos.length - 1) tl.set(d, { opacity: 0 }, grupos[gi + 1][0][1] - 0.02);
  });

  tl.set({}, {}, DUR);
  window.__RECORTES_TL = tl;
  window.__timelines[root.getAttribute("data-composition-id")] = tl;
})();
