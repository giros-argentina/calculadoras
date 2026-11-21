/* giros-calculadoras: rollover de bonos, duración de saldo y cuotas combinadas. Funciones puras, sin DOM. */
export { numeros, AR } from './numeros.js';
export { BASES, leerNumero, miles, ars, veces, calcularRollover, textoRollover } from './rollover.js';
export { TEXTOS as TEXTOS_SALDO, calcularSaldo, duracion, textoSaldo } from './saldo.js';
export {
  TEXTOS as TEXTOS_CUOTAS, MAX_SELECCIONES, fraccion, leerCuota, cuotaTexto, probabilidadImplicita, calcularCuotas, textoCuotas
} from './cuotas.js';
