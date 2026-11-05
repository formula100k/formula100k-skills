// Utilidades: todo el video es una función pura del tiempo.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const mix = (a, b, p) => a + (b - a) * p;

export const E = {
  lin: (x) => x,
  out: (x) => 1 - (1 - x) ** 3,
  in: (x) => x ** 3,
  inOut: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  back: (x) => 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2,
};

// progreso 0..1 entre a y b
export const k = (t, a, b, e = E.out) => e(clamp((t - a) / Math.max(1e-6, b - a)));

// PRNG con semilla (sin Math.random: el render sale igual siempre)
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
// «*así*» → resaltado
export const rico = (s, tag = 'span class="k"') => esc(s).replace(/\*([^*]+)\*/g, `<${tag}>$1</${tag.split(' ')[0]}>`);
export const plano = (s) => String(s).replace(/\*/g, '');
