/* rollover.js: cuánto hay que apostar para liberar un bono.
   bono = depósito x porcentaje / 100, con tope opcional.
   total = base x rollover; la base es el bono, depósito + bono o el depósito. */

export const BASES = { bono: 'sobre el bono', suma: 'sobre depósito + bono', deposito: 'sobre el depósito' };

// Texto a número: el punto es separador de miles y la coma es decimal. Vacío, texto o negativo dan 0.
export function leerNumero(txt) {
  const t = String(txt === null || txt === undefined ? '' : txt).replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(t);
  return isFinite(n) && n > 0 ? n : 0;
}

// Entero redondeado con punto de miles: 1234567 es «1.234.567».
export function miles(n) {
  n = Math.round(n);
  let s = String(Math.abs(n)), out = '';
  while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); }
  return (n < 0 ? '-' : '') + s + out;
}

export function ars(n) { return 'ARS ' + miles(n); }

// Rollover con hasta dos decimales y coma: 35 es «35x», 37.5 es «37,5x».
export function veces(n) { return String(Math.round(n * 100) / 100).replace('.', ',') + 'x'; }

const pos = (x) => (typeof x === 'number' && isFinite(x) && x > 0 ? x : 0);
const claveBase = (b) => (b === 'suma' || b === 'deposito' ? b : 'bono');

/* Entrada en números: deposito, porcentaje, tope, rollover, apuesta, dias. base: 'bono' | 'suma' | 'deposito'.
   Lo que falta o no es mayor que 0 cuenta como 0. giros y porDia son null cuando no se pueden calcular. */
export function calcularRollover({ deposito, porcentaje, tope, rollover, base, apuesta, dias } = {}) {
  const d = pos(deposito), p = pos(porcentaje), t = pos(tope), r = pos(rollover), a = pos(apuesta), dd = pos(dias);
  const b = claveBase(base);
  let bono = d * p / 100, conTope = false;
  if (t > 0 && bono > t) { bono = t; conTope = true; }
  const baseMonto = b === 'suma' ? d + bono : b === 'deposito' ? d : bono;
  const total = baseMonto * r;
  return {
    bono, conTope, base: b, baseMonto, total,
    giros: total > 0 && a > 0 ? Math.ceil(total / a) : null,
    porDia: total > 0 && dd > 0 ? total / dd : null
  };
}

// Los mismos datos, ya escritos para mostrar.
export function textoRollover(entrada = {}) {
  const d = pos(entrada.deposito), r = pos(entrada.rollover), a = pos(entrada.apuesta), dd = pos(entrada.dias);
  const c = calcularRollover(entrada);
  const out = {
    bono: d > 0 ? ars(c.bono) + (c.conTope ? ', es el tope' : '') : 'cargá el depósito',
    total: c.total > 0 ? ars(c.total) : 'ARS 0',
    giros: c.giros !== null ? miles(c.giros) + ' giros de ' + ars(a) : 'cargá la apuesta promedio',
    veredicto: ''
  };
  if (!(d > 0) || !(r > 0)) { out.veredicto = 'Cargá el depósito y el rollover para ver cuánto hay que apostar.'; return out; }
  if (!(c.total > 0)) { out.veredicto = 'Con estos datos no hay nada que apostar: revisá el porcentaje del bono y la base del rollover.'; return out; }
  let v = 'Con un rollover de ' + veces(r) + ' ' + BASES[c.base] + ' tenés que apostar ' + ars(c.total);
  if (c.porDia !== null) v += ', ' + ars(c.porDia) + ' por día durante ' + miles(dd) + (dd === 1 ? ' día' : ' días');
  if (c.giros !== null) v += '; son ' + miles(c.giros) + ' giros de ' + ars(a);
  out.veredicto = v + '.';
  return out;
}
