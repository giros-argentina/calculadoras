/* saldo.js: cuánto dura un saldo en tragamonedas, en promedio.
   pérdida esperada por giro = apuesta x (1 - RTP / 100)
   giros esperados = saldo / pérdida por giro
   tiempo promedio = giros / giros por minuto */

import { AR } from './numeros.js';

export const TEXTOS = {
  faltaDatos: 'cargá los datos', faltaRitmo: 'cargá los giros por minuto',
  vFalta: 'Cargá el saldo, la apuesta por giro y el RTP para hacer la cuenta.',
  vRtp: 'El RTP va en porcentaje, entre 0 y 100. Con 100 % o más no hay pérdida esperada y la cuenta no aplica.',
  vMayor: 'La apuesta por giro, %1, es mayor que el saldo, %2. No alcanza para un giro.',
  vOk: 'Con RTP %1, cada giro de %2 pierde en promedio %3. El saldo de %4 alcanza en promedio para %5.',
  vTiempo: 'A %1 giros por minuto, el tiempo promedio es %2.',
  unGiro: '1 giro', nGiros: '%1 giros',
  dMenos: 'menos de 1 min', dMin: '%1 min', dHora: '%1 h', dHoraMin: '%1 h %2 min'
};

const pon = (s, v) => String(s).replace(/%(\d)/g, (m, i) => (v[i - 1] === null || v[i - 1] === undefined ? '' : String(v[i - 1])));

/* Entrada en números; null o undefined es un dato sin cargar, NaN uno mal escrito.
   Límites: saldo y apuesta mayores que 0 y hasta 1e12, RTP de 0 a menos de 100, giros por minuto hasta 1000.
   estado: 'ok' | 'faltan-datos' | 'rtp-invalido' | 'apuesta-mayor'. */
export function calcularSaldo({ saldo, apuesta, rtp, girosPorMinuto } = {}) {
  const S = saldo, A = apuesta, R = rtp === undefined ? null : rtp, G = girosPorMinuto;
  const okS = S > 0 && S <= 1e12, okA = A > 0 && A <= 1e12, okR = R !== null && R >= 0 && R < 100, okG = G > 0 && G <= 1000;
  const nada = (estado) => ({ estado, perdidaPorGiro: null, giros: null, girosRedondeados: null, minutos: null });
  if (!okS || !okA || R === null) return nada('faltan-datos');
  if (!okR) return nada('rtp-invalido');
  if (A > S) return nada('apuesta-mayor');
  const perdidaPorGiro = A * (1 - R / 100), giros = S / perdidaPorGiro;
  return { estado: 'ok', perdidaPorGiro, giros, girosRedondeados: Math.round(giros), minutos: okG ? giros / G : null };
}

// Minutos a texto: «menos de 1 min», «45 min», «4 h», «4 h 10 min».
export function duracion(min, N = AR, T = TEXTOS) {
  const t = Math.round(min);
  if (t < 1) return T.dMenos;
  if (t < 60) return pon(T.dMin, [t]);
  const h = Math.floor(t / 60), r = t % 60;
  return r ? pon(T.dHoraMin, [N.fmt(h, 0, 0), r]) : pon(T.dHora, [N.fmt(h, 0, 0)]);
}

// Los mismos datos, ya escritos para mostrar.
export function textoSaldo(entrada = {}, N = AR, T = TEXTOS) {
  const c = calcularSaldo(entrada);
  const nada = (v) => ({ perdida: T.faltaDatos, giros: T.faltaDatos, tiempo: T.faltaDatos, veredicto: v });
  if (c.estado === 'faltan-datos') return nada(T.vFalta);
  if (c.estado === 'rtp-invalido') return nada(T.vRtp);
  if (c.estado === 'apuesta-mayor') return nada(pon(T.vMayor, [N.plata(entrada.apuesta), N.plata(entrada.saldo)]));
  const g = c.girosRedondeados;
  const gTxt = g === 1 ? T.unGiro : pon(T.nGiros, [N.fmt(g, 0, 0)]);
  let v = pon(T.vOk, [N.fmt(entrada.rtp, 0, 2) + ' %', N.plata(entrada.apuesta), N.plata(c.perdidaPorGiro), N.plata(entrada.saldo), gTxt]);
  let tiempo = T.faltaRitmo;
  if (c.minutos !== null) {
    tiempo = duracion(c.minutos, N, T);
    v += ' ' + pon(T.vTiempo, [N.fmt(entrada.girosPorMinuto, 0, 2), tiempo]);
  }
  return { perdida: N.plata(c.perdidaPorGiro), giros: N.fmt(g, 0, 0), tiempo, veredicto: v };
}
