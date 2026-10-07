/* Mascotas pixel de la animación de recortes. Cada una simboliza lo que representa:
   reel = tu contenido · imán = atraer · regadera = nutrir · bolsa = convertir · persona = la gente que te ve o te compra.
   Se dibujan en una rejilla (1 unidad = 1 pixel), se les pone contorno de tinta solo y salen como SVG.
   Colores especiales: "A" el acento del tema · "E" ojo (parpadea) · "G" brillo del ojo · "_" hueco que no lleva contorno · "N" chispa sin contorno.
   window.MASCOTA(nombre, { lleva, acento, color, v, pelo, peinado, piel, ropa, pantalon }) → { svg, w, h } */
(function () {
  const K = "#1A1612", BL = "#FFFDF7";
  const PROPS = {
    // imán de herradura, con chispas de atracción
    iman: { w: 10, h: 12, px: [
      [0, 3, 3, 6, "#D8452E"], [7, 3, 3, 6, "#D8452E"], [0, 9, 10, 2, "#D8452E"], [1, 11, 8, 1, "#D8452E"],
      [3, 9, 4, 1, null], [0, 3, 3, 2, "#EFE9DC"], [7, 3, 3, 2, "#EFE9DC"], [1, 6, 1, 4, "#F08A76"],
      [3, 3, 4, 5, "_"], [1, 0, 1, 2, "N"], [8, 0, 1, 2, "N"], [4, 0, 2, 1, "N"] ] },
    // regadera con gotas
    regadera: { w: 12, h: 10, px: [
      [1, 3, 6, 6, "#4F86E8"], [1, 2, 6, 1, "#2F5FB8"], [2, 4, 1, 4, "#9CC0FF"],
      [0, 0, 5, 1, "#2F5FB8"], [0, 1, 1, 2, "#2F5FB8"], [4, 1, 1, 1, "#2F5FB8"],
      [7, 6, 1, 2, "#4F86E8"], [8, 5, 1, 2, "#4F86E8"], [9, 4, 1, 2, "#4F86E8"], [9, 3, 3, 1, "#2F5FB8"],
      [11, 5, 1, 1, "#7FD0F5"], [10, 7, 1, 1, "#7FD0F5"], [11, 9, 1, 1, "#7FD0F5"] ] },
    // bolsa de compra con corazón
    bolsa: { w: 9, h: 12, px: [
      [2, 0, 5, 1, K], [2, 1, 1, 3, K], [6, 1, 1, 3, K], [3, 1, 3, 3, "_"],
      [0, 4, 9, 8, "A"], [0, 4, 9, 1, "#D1902A"],
      [2, 6, 2, 2, BL], [5, 6, 2, 2, BL], [3, 7, 3, 2, BL], [4, 9, 1, 1, BL] ] },
    // moneda
    moneda: { w: 7, h: 7, px: [
      [2, 0, 3, 7, "A"], [1, 1, 5, 5, "A"], [0, 2, 7, 3, "A"],
      [3, 2, 1, 3, "#B87A1C"], [1, 1, 1, 1, "#FFE39A"], [2, 1, 1, 1, "#FFE39A"] ] },
    // corazón (confianza)
    corazon: { w: 9, h: 8, px: [
      [1, 0, 3, 1, "#E5484D"], [5, 0, 3, 1, "#E5484D"], [0, 1, 9, 3, "#E5484D"], [1, 4, 7, 1, "#E5484D"],
      [2, 5, 5, 1, "#E5484D"], [3, 6, 3, 1, "#E5484D"], [4, 7, 1, 1, "#E5484D"], [1, 1, 2, 1, "#FF9DA0"] ] },
  };
  const PELOS = ["#5A3A22", "#B5432A", "#2B2420", "#E0A93B", "#8A5A3C"];
  const PIELES = ["#F2C9A5", "#D9A074", "#F7D9BF", "#B97D52", "#EAB88F"];
  const ROPAS = ["#B9CFA8", "#F3B6C4", "#BFD0F5", "#FFFDF7", "A"];
  const PEINADOS = ["largo", "corto", "chongo", "largo", "corto"];

  const BASES = {
    // Tu contenido: un teléfono con un reel en pantalla, cara y patas
    reel(o) {
      const c = o.color || "#F3B6C4";
      // funda de color, pantalla clara con la cara, botón de play, corazón y comentario, y la barra de avance del video
      return { w: 20, h: 30, mano: [19, 9], px: [
        [3, 1, 14, 25, c], [2, 2, 16, 23, c], [3, 2, 1, 6, "#FBD9E1"], [9, 23, 2, 1, "#D98AA0"],
        [4, 3, 12, 19, "#FFFDF7"], [8, 3, 4, 1, K],
        [6, 5, 2, 3, "E"], [11, 5, 2, 3, "E"], [6, 5, 1, 1, "G"], [11, 5, 1, 1, "G"],
        [5, 10, 2, 1, "#F3A0B4"], [13, 10, 2, 1, "#F3A0B4"], [8, 10, 4, 1, K], [7, 9, 1, 1, K], [12, 9, 1, 1, K],
        [6, 13, 5, 5, "A"], [7, 12, 3, 1, "A"], [7, 18, 3, 1, "A"], [8, 14, 1, 3, K], [9, 15, 1, 1, K],
        [12, 12, 1, 2, "#E5484D"], [14, 12, 1, 2, "#E5484D"], [13, 13, 1, 2, "#E5484D"],
        [12, 16, 3, 2, "#7F8FB8"], [12, 18, 1, 1, "#7F8FB8"],
        [5, 20, 10, 1, "#D8CFC0"], [5, 20, 4, 1, "#E5484D"],
        [1, 11, 1, 3, K], [18, 11, 1, 3, K],
        [6, 26, 2, 2, K], [12, 26, 2, 2, K], [6, 28, 3, 1, K], [12, 28, 3, 1, K] ] };
    },
    // La gente: quien pasa, quien se detiene, quien compra
    persona(o) {
      const v = o.v || 0, pelo = o.pelo || PELOS[v % 5], piel = o.piel || PIELES[v % 5], ropa = o.ropa || ROPAS[v % 5];
      const pant = o.pantalon || ["#3D5A80", "#5A4636", "#2B2420", "#7A4E6E", "#4D6B4A"][v % 5], pein = o.peinado || PEINADOS[v % 5];
      const px = [
        [5, 1, 6, 1, pelo], [4, 2, 8, 3, pelo],
        [4, 4, 8, 6, piel], [4, 4, 8, 1, pelo], [4, 5, 1, 1, pelo], [11, 5, 1, 1, pelo],
        [6, 6, 1, 2, "E"], [9, 6, 1, 2, "E"], [5, 8, 1, 1, "#F08A76"], [10, 8, 1, 1, "#F08A76"], [7, 8, 2, 1, "#B5432A"],
        [7, 10, 2, 1, piel],
        [4, 11, 8, 6, ropa], [2, 11, 2, 3, ropa], [12, 11, 2, 3, ropa], [2, 14, 2, 3, piel], [12, 14, 2, 3, piel],
        [7, 11, 2, 1, piel],
        [4, 17, 8, 3, pant], [5, 20, 2, 2, pant], [9, 20, 2, 2, pant], [4, 22, 3, 1, K], [9, 22, 3, 1, K] ];
      if (pein === "largo") px.push([3, 3, 1, 9, pelo], [12, 3, 1, 9, pelo]);
      if (pein === "chongo") px.unshift([6, 0, 4, 1, pelo]), px.push([3, 3, 1, 3, pelo], [12, 3, 1, 3, pelo]);
      return { w: 16, mano: [14, 11], px };
    },
  };

  window.MASCOTA = function (nombre, o) {
    o = o || {};
    const acento = o.acento || "#F4D35E";
    let b, H = 24;
    if (BASES[nombre]) { b = BASES[nombre](o); H = b.h || 24; }
    else if (PROPS[nombre]) { const p = PROPS[nombre]; b = { w: p.w + 2, px: p.px.map((r) => [r[0] + 1, r[1] + 1, r[2], r[3], r[4]]) }; H = p.h + 2; }
    else return null;
    let W = b.w, px = b.px.slice();
    if (o.lleva && PROPS[o.lleva] && b.mano) {
      const p = PROPS[o.lleva], ox = b.mano[0], oy = b.mano[1];
      p.px.forEach((r) => px.push([r[0] + ox, r[1] + oy, r[2], r[3], r[4]]));
      W = ox + p.w + 1;
    }
    // rejilla → contorno → rectángulos por tramos
    const g = Array.from({ length: H }, () => Array(W).fill(null));
    px.forEach((r) => { for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) if (y >= 0 && y < H && x >= 0 && x < W) {
      g[y][x] = r[4];
    } });
    const lleno = (x, y) => y >= 0 && y < H && x >= 0 && x < W && g[y][x] && g[y][x] !== "_" && g[y][x] !== "N";
    const borde = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!g[y][x] && (lleno(x - 1, y) || lleno(x + 1, y) || lleno(x, y - 1) || lleno(x, y + 1))) borde.push([x, y]);
    borde.forEach((p) => { g[p[1]][p[0]] = K; });
    let s = "";
    for (let y = 0; y < H; y++) for (let x = 0; x < W;) {
      const c = g[y][x]; if (!c || c === "_") { x++; continue; }
      let n = 1; while (x + n < W && g[y][x + n] === c) n++;
      const f = c === "E" ? K : c === "G" ? "#FFFFFF" : c === "N" || c === "A" ? acento : c;
      s += `<rect x="${x}" y="${y}" width="${n + 0.04}" height="1.04" fill="${f}"${c === "E" ? ' class="mo"' : ""}/>`;
      x += n;
    }
    return { w: W, h: H, bw: b.w, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" style="position:absolute;display:block;left:0;top:0;height:100%;width:auto;aspect-ratio:${W}/${H};overflow:visible">${s}</svg>` };
  };
})();
