/* cuotas.js: cuota combinada, pago posible y probabilidad implícita.
   Todo se guarda en cuota decimal.
   fraccionaria p/q = decimal - 1; americana = +(decimal - 1) x 100 o -100 / (decimal - 1)
   cuota combinada = producto de las cuotas; pago = monto x cuota combinada
   ganancia neta = pago - monto; probabilidad implícita = 1 / cuota */

import { AR } from './numeros.js';

export const MAX_SELECCIONES = 8; // filas que ofrece la página; la cuenta no tiene tope

export const TEXTOS = {
  sin: 'sin cuota', mal: 'no válida', faltaCuotas: 'cargá las cuotas', faltaMonto: 'cargá el monto',
  vVacio: 'Cargá al menos una cuota para calcular.', vMal: 'Revisá la selección %1: %2.',
  malDec: 'la cuota decimal es un número mayor que 1, como %1',
  malFra: 'la cuota fraccionaria va como 5/2, con dos números mayores que 0',
  malAme: 'la cuota americana va como +150 o -200, de 100 para arriba',
  vSinMonto: 'Cuota combinada %1, probabilidad implícita %2. Cargá el monto para ver el pago posible.',
  v1: 'Con %1 a cuota %2 el pago posible es %3, con %4 de ganancia neta si se cumple la selección.',
  vN: 'Con %1 a cuota %2 el pago posible es %3, con %4 de ganancia neta si se cumplen las %5 selecciones.'
};

const pon = (s, v) => String(s).replace(/%(\d)/g, (m, i) => (v[i - 1] === null || v[i - 1] === undefined ? '' : String(v[i - 1])));

// Mejor fracción p/q con q <= 1000, por fracciones continuas.
export function fraccion(x) {
  let p0 = 0, q0 = 1, p1 = 1, q1 = 0, r = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(r), p2 = a * p1 + p0, q2 = a * q1 + q0;
    if (q2 > 1000 || !isFinite(p2)) break;
    p0 = p1; q0 = q1; p1 = p2; q1 = q2;
    if (Math.abs(r - a) < 1e-9) break;
    r = 1 / (r - a);
  }
  if (q1 === 0 || p1 === 0) { p1 = 1; q1 = Math.max(1, Math.round(1 / x)); }
  return { p: p1, q: q1, exacta: Math.abs(p1 / q1 - x) <= 1e-9 * Math.max(1, x) };
}

/* Texto a cuota decimal. formato: 'dec' | 'fra' | 'ame'.
   null si está vacío, NaN si no es válida, si no la cuota decimal (mayor que 1 y hasta 1e6). */
export function leerCuota(txt, formato = 'dec', N = AR) {
  let t = String(txt || '').replace(/[\s  ]/g, ''), n;
  if (t === '') return null;
  if (formato === 'fra') {
    const m = t.split('/');
    if (m.length > 2) return NaN;
    const a = N.leer(m[0], 'dec'), b = m.length === 2 ? N.leer(m[1], 'dec') : 1;
    n = a > 0 && b > 0 ? 1 + a / b : NaN;
  } else if (formato === 'ame') {
    const neg = t.charAt(0) === '-' || t.charAt(0) === '−';
    if (neg || t.charAt(0) === '+') t = t.slice(1);
    const a = N.leer(t, 'mon');
    n = a >= 100 ? (neg ? 1 + 100 / a : 1 + a / 100) : NaN;
  } else {
    n = N.leer(t, 'dec');
  }
  return n > 1 && n <= 1e6 ? n : NaN;
}

// Cuota decimal a texto en el formato pedido. campo = true: texto para volver a leer, sin «≈».
export function cuotaTexto(d, formato = 'dec', campo = false, N = AR) {
  if (formato === 'fra') { const q = fraccion(d - 1); return (q.exacta || campo ? '' : '≈ ') + q.p + '/' + q.q; }
  if (formato === 'ame') return d >= 2 ? '+' + N.fmt((d - 1) * 100, 0, 2) : '-' + N.fmt(100 / (d - 1), 0, 2);
  return N.fmt(d, 2, 4);
}

export function probabilidadImplicita(d) { return 1 / d; }

/* cuotas: lista de cuotas decimales; null o undefined es una fila vacía y se saltea, un valor que no es mayor que 1 no es válido.
   monto: número mayor que 0 y hasta 1e12, o null si falta.
   estado: 'ok' | 'sin-cuotas' | 'cuota-invalida' | 'sin-monto'. invalida es el número de fila, desde 1. */
export function calcularCuotas({ cuotas = [], monto = null } = {}) {
  let n = 0, prod = 1, invalida = null;
  cuotas.forEach((v, k) => {
    if (v === null || v === undefined) return;
    if (!(v > 1)) { if (invalida === null) invalida = k + 1; return; }
    n++; prod *= v;
  });
  const base = { n, invalida, combinada: null, probabilidad: null, pago: null, neta: null };
  if (invalida !== null) return { estado: 'cuota-invalida', ...base };
  if (n === 0) return { estado: 'sin-cuotas', ...base };
  const r = { ...base, combinada: prod, probabilidad: 1 / prod };
  if (!(monto > 0 && monto <= 1e12)) return { estado: 'sin-monto', ...r };
  const pago = monto * prod;
  return { estado: 'ok', ...r, pago, neta: pago - monto };
}

// Los mismos datos, ya escritos para mostrar.
export function textoCuotas({ cuotas = [], monto = null, formato = 'dec' } = {}, N = AR, T = TEXTOS) {
  const c = calcularCuotas({ cuotas, monto });
  const filas = cuotas.map((v) => (v === null || v === undefined ? T.sin : !(v > 1) ? T.mal : N.pct(1 / v)));
  if (c.estado === 'cuota-invalida' || c.estado === 'sin-cuotas') {
    const mal = formato === 'fra' ? T.malFra : formato === 'ame' ? T.malAme : T.malDec;
    return {
      filas, combinada: T.faltaCuotas, probabilidad: T.faltaCuotas, pago: T.faltaCuotas, neta: T.faltaCuotas,
      veredicto: c.estado === 'cuota-invalida' ? pon(T.vMal, [c.invalida, pon(mal, [N.fmt(1.85, 2, 2)])]) : T.vVacio
    };
  }
  const comb = cuotaTexto(c.combinada, formato, false, N), prob = N.pct(c.probabilidad);
  if (c.estado === 'sin-monto') {
    return { filas, combinada: comb, probabilidad: prob, pago: T.faltaMonto, neta: T.faltaMonto, veredicto: pon(T.vSinMonto, [comb, prob]) };
  }
  return {
    filas, combinada: comb, probabilidad: prob, pago: N.pago(c.pago), neta: N.pago(c.neta),
    veredicto: pon(c.n === 1 ? T.v1 : T.vN, [N.plata(monto), comb, N.pago(c.pago), N.pago(c.neta), c.n])
  };
}
