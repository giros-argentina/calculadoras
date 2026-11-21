/* numeros.js: lectura y formato de números según la configuración regional.
   Sin DOM. Por defecto es-AR y ARS: punto de miles y coma decimal. */

export function numeros(locale = 'es-AR', mon = 'ARS') {
  let G = '.', D = ',', decMon = 2;
  try {
    for (const p of new Intl.NumberFormat(locale).formatToParts(1234567.5)) {
      if (p.type === 'group') G = p.value;
      if (p.type === 'decimal') D = p.value;
    }
  } catch (e) { /* queda el formato es-AR */ }
  try { // monedas sin centavos: los pagos van en unidades enteras
    if (new Intl.NumberFormat(locale, { style: 'currency', currency: mon }).resolvedOptions().maximumFractionDigits === 0) decMon = 0;
  } catch (e) { decMon = 2; }
  const dLee = D === '.' ? '.' : ',', gLee = dLee === '.' ? ',' : '.'; // al leer solo cuentan el punto y la coma

  // n con entre min y max decimales y separador de miles
  function fmt(n, min, max) {
    if (typeof n !== 'number' || !isFinite(n)) return '';
    const a = Math.abs(n);
    if (a >= 1e15) return (n < 0 ? '-' : '') + a.toExponential(2).replace('.', D);
    const f = Math.pow(10, max), s = (Math.round(a * f + 1e-7) / f).toFixed(max); // el 1e-7 sube los empates que el binario deja apenas abajo
    const p = s.split('.');
    let ent = p[0], dec = p[1] || '', out = '';
    while (dec.length > min && dec.charAt(dec.length - 1) === '0') dec = dec.slice(0, -1);
    while (ent.length > 3) { out = G + ent.slice(-3) + out; ent = ent.slice(0, -3); }
    return (n < 0 && Number(s) !== 0 ? '-' : '') + ent + out + (dec ? D + dec : '');
  }
  const veces = (t, c) => t.split(c).length - 1;
  const grupos = (t, c) => new RegExp('^\\d{1,3}(\\' + c + '\\d{3})+$').test(t);

  /* Devuelve null si está vacío, NaN si no es un número y el número si lo es.
     modo 'mon': «20.000» son veinte mil. modo 'dec': un solo separador siempre es decimal. */
  function leer(txt, modo) {
    const t = String(txt === null || txt === undefined ? '' : txt).replace(/[\s  ]/g, '');
    if (t === '') return null;
    if (!/^[0-9.,]+$/.test(t) || !/[0-9]/.test(t)) return NaN;
    const nD = veces(t, dLee), nG = veces(t, gLee);
    let dec = '';
    if (nD && nG) {
      dec = t.lastIndexOf(dLee) > t.lastIndexOf(gLee) ? dLee : gLee;
      if (veces(t, dec) !== 1) return NaN;
    } else if (nD) {
      if (nD === 1) dec = dLee; else if (!grupos(t, dLee)) return NaN;
    } else if (nG) {
      if (nG === 1) { if (!(modo === 'mon' && grupos(t, gLee))) dec = gLee; } else if (!grupos(t, gLee)) return NaN;
    }
    let limpio = '';
    for (const c of t) {
      if (c === dec) limpio += '.'; else if (c !== '.' && c !== ',') limpio += c;
    }
    const n = Number(limpio);
    return isFinite(n) ? n : NaN;
  }

  // entero sin decimales; con centavos, siempre dos
  function monto(n) {
    const r = Math.round(n * 100 + 1e-7) / 100, entero = Math.abs(r - Math.round(r)) < 1e-9;
    return entero ? fmt(r, 0, 0) : fmt(r, 2, 2);
  }
  const plata = (n) => mon + ' ' + monto(n);                              // monto tal cual, con centavos si los tiene
  const pago = (n) => mon + ' ' + (decMon === 0 ? fmt(n, 0, 0) : monto(n)); // plata que se cobra
  function pct(p) {
    if (p > 0 && p < 0.0001) return '< ' + fmt(0.01, 2, 2) + ' %';
    return fmt(p * 100, 0, 2) + ' %';
  }
  return { fmt, leer, monto, plata, pago, pct };
}

// Instancia para Argentina, la que usan los módulos por defecto.
export const AR = numeros('es-AR', 'ARS');
