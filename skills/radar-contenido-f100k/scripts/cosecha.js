// RADAR DE CONTENIDO · cosecha de Instagram con tu sesión abierta. Se pega con la herramienta
// javascript_tool de Claude in Chrome en una pestaña de www.instagram.com.
//
// Por qué así y no scrolleando la cuadrícula:
//  - La cuadrícula de /explore/ está virtualizada y no pagina con scroll programático.
//    La API interna que usa la propia web SÍ pagina y trae play_count (las vistas).
//  - Las vistas NO están en el DOM. La API las da; la captura de /<user>/reels/ sirve de control
//    (probado: un perfil que en pantalla dice «12,2 M» devuelve play_count 12.253.938).
//  - La pestaña de claude-in-chrome suele estar OCULTA ⇒ Chrome congela setTimeout (~1/min).
//    Nada de bucles con esperas: tandas con Promise.all dentro de UNA llamada (<45 s o CDP corta).
//  - navigate() recarga la página y BORRA window.*. Todo se persiste en localStorage.
//
// Uso (una llamada de javascript_tool por línea):
//   <pegar este archivo>                        → define window.RX
//   await RX.explorar(3)                        → 3 páginas de Explorar (~25 reels c/u)
//   await RX.explorar(3, true)                  → la variante NO personalizada (canal 'explorar-neutro')
//   await RX.buscar(['storytime','mi historia','te cuento'])   → máx 3 por llamada
//   await RX.seguidores(14)                     → repetir hasta que devuelva pedidos:0
//   RX.candidatos({minVistas:100000, maxSeg:500000, minRatio:20})
//   RX.exportar()                               → JSON para escribir a disco

(() => {
  const KEY = 'radar_explorar_v1';
  const H = { 'x-ig-app-id': '936619743392459', 'x-requested-with': 'XMLHttpRequest' };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || { items: {}, users: {}, log: [], explore: {} }; } catch { return { items: {}, users: {}, log: [], explore: {} }; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { console.log('[RX] no se pudo guardar', e); } };
  const walk = (o, out) => { if (!o || typeof o !== 'object') return; if (o.code && o.user && o.media_type !== undefined) out.push(o); for (const k in o) { const v = o[k]; if (v && typeof v === 'object') walk(v, out); } };
  const fila = (m, canal) => ({
    code: m.code, canal, user: m.user.username, pk: String(m.user.pk || m.user.id),
    plays: m.play_count ?? m.ig_play_count ?? null, likes: m.like_count ?? null, comments: m.comment_count ?? null,
    dur: m.video_duration ? Math.round(m.video_duration) : null, taken: m.taken_at,
    cap: ((m.caption && m.caption.text) || '').replace(/\s+/g, ' ').slice(0, 220),
  });
  const anotar = (s, m, canal) => {
    if (m.media_type !== 2) return false;             // solo video
    const prev = s.items[m.code];
    if (prev) { if (!prev.canal.split(' | ').includes(canal)) prev.canal += ' | ' + canal; return false; }
    s.items[m.code] = fila(m, canal); return true;
  };

  window.RX = {
    async explorar(paginas = 3, noPersonal = false) {
      // is_nonpersonalized_explore=true da otra cuadrícula, pero dos cargas personalizadas tampoco
      // coinciden entre sí: el solape NO mide el sesgo. Se etiqueta el canal y se compara por nicho.
      const s = load(); let nuevos = 0; const canal = noPersonal ? 'explorar-neutro' : 'explorar'; const k = noPersonal ? 'max_id_neutro' : 'max_id';
      for (let i = 0; i < paginas; i++) {
        let url = '/api/v1/discover/web/explore_grid/?is_prefetch=false&omit_cover_media=false&module=explore_popular&use_sectional_payload=true&cluster_id=explore_all%3A0&include_fixed_destinations=true&is_nonpersonalized_explore=' + noPersonal;
        if (s.explore[k]) url += '&max_id=' + encodeURIComponent(s.explore[k]);
        const r = await fetch(url, { headers: H, credentials: 'include' });
        if (r.status !== 200) { s.log.push(`explorar HTTP ${r.status}`); break; }
        const j = await r.json(); const out = []; walk(j, out);
        for (const m of out) if (anotar(s, m, canal)) nuevos++;
        s.explore[k] = j.next_max_id || null; save(s);
        if (!s.explore[k]) break;
      }
      return { nuevos, total: Object.keys(s.items).length };
    },
    async buscar(queries) {
      if (queries.length > 3) return 'máx 3 por llamada (CDP corta a los 45 s)';
      const s = load(); const res = {};
      await Promise.all(queries.map(async (q) => {
        // frases CORTAS: 2-3 palabras o IG devuelve 0 sin avisar
        const r = await fetch('/api/v1/fbsearch/web/top_serp/?search_surface=web_top_serp&query=' + encodeURIComponent(q), { headers: H, credentials: 'include' });
        if (r.status !== 200) { res[q] = 'HTTP ' + r.status; return; }
        const out = []; walk(await r.json(), out);
        res[q] = out.filter((m) => anotar(s, m, 'busqueda:' + q)).length;
      }));
      save(s); return { res, total: Object.keys(s.items).length };
    },
    async seguidores(n = 14, minVistas = 100000) {
      const s = load();
      const pks = [...new Set(Object.values(s.items).filter((x) => (x.plays || 0) >= minVistas).map((x) => x.pk))].filter((pk) => !s.users[pk]).slice(0, n);
      const errs = [];
      await Promise.all(pks.map(async (pk) => {
        const r = await fetch('/api/v1/users/' + pk + '/info/', { headers: H, credentials: 'include' });
        if (r.status !== 200) { errs.push(r.status); return; }   // 429 ⇒ para y reintenta más tarde
        const u = (await r.json()).user;
        s.users[pk] = { followers: u.follower_count, verified: u.is_verified, cat: u.category || null, media: u.media_count };
      }));
      save(s); return { pedidos: pks.length, errs, hechos: Object.keys(s.users).length };
    },
    candidatos({ minVistas = 100000, maxSeg = 500000, minRatio = 20 } = {}) {
      const s = load();
      return Object.values(s.items).map((x) => {
        const u = s.users[x.pk] || {};
        return { ...x, followers: u.followers ?? null, verified: u.verified ?? null, cat: u.cat ?? null, ratio: u.followers ? +(x.plays / u.followers).toFixed(1) : null };
      }).filter((x) => x.plays >= minVistas && x.followers != null && x.followers <= maxSeg && x.ratio >= minRatio)
        .sort((a, b) => b.ratio - a.ratio);
    },
    exportar() { return JSON.stringify(load()); },
    reiniciar() { localStorage.removeItem(KEY); return 'vacío'; },
  };
  return 'RX listo · ' + Object.keys(load().items).length + ' reels guardados';
})();
