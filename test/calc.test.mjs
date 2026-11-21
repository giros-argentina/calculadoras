// Pruebas con node:test, sin dependencias. Cada caso lleva la cuenta hecha a mano en el comentario.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { numeros, AR } from '../src/numeros.js';
import { leerNumero, miles, veces, calcularRollover, textoRollover } from '../src/rollover.js';
import { calcularSaldo, duracion, textoSaldo } from '../src/saldo.js';
import { fraccion, leerCuota, cuotaTexto, calcularCuotas, textoCuotas } from '../src/cuotas.js';

// igualdad con tolerancia para las cuentas con decimales binarios (200 x 0,04 da 8,000000000000007)
const cerca = (a, b, msg) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${msg || ''} ${a} vs ${b}`);

/* ---------------- rollover ---------------- */

test('rollover 1: 100 % y 35x sobre el bono', () => {
  // bono = 20.000 x 100 / 100 = 20.000; total = 20.000 x 35 = 700.000
  const c = calcularRollover({ deposito: 20000, porcentaje: 100, rollover: 35, base: 'bono' });
  assert.equal(c.bono, 20000);
  assert.equal(c.conTope, false);
  assert.equal(c.total, 700000);
  assert.equal(c.giros, null);
  assert.equal(c.porDia, null);
  assert.equal(textoRollover({ deposito: 20000, porcentaje: 100, rollover: 35, base: 'bono' }).veredicto,
    'Con un rollover de 35x sobre el bono tenés que apostar ARS 700.000.');
});

test('rollover 2: 250 % sin llegar al tope, 40x sobre el bono', () => {
  // bono = 40.000 x 250 / 100 = 100.000 (tope 300.000, no llega); total = 100.000 x 40 = 4.000.000; giros = 4.000.000 / 1.000 = 4.000
  const c = calcularRollover({ deposito: 40000, porcentaje: 250, tope: 300000, rollover: 40, base: 'bono', apuesta: 1000 });
  assert.equal(c.bono, 100000);
  assert.equal(c.conTope, false);
  assert.equal(c.total, 4000000);
  assert.equal(c.giros, 4000);
});

test('rollover 3: el bono queda en el tope', () => {
  // bono = 120.000 x 250 / 100 = 300.000; no supera el tope de 300.000, así que no se marca
  let c = calcularRollover({ deposito: 120000, porcentaje: 250, tope: 300000, rollover: 40, base: 'bono' });
  assert.equal(c.bono, 300000);
  assert.equal(c.conTope, false);
  // bono = 200.000 x 250 / 100 = 500.000 > 300.000, queda 300.000; total = 300.000 x 40 = 12.000.000; giros de 1.000 = 12.000
  c = calcularRollover({ deposito: 200000, porcentaje: 250, tope: 300000, rollover: 40, base: 'bono', apuesta: 1000 });
  assert.equal(c.bono, 300000);
  assert.equal(c.conTope, true);
  assert.equal(c.total, 12000000);
  assert.equal(c.giros, 12000);
  assert.equal(textoRollover({ deposito: 200000, porcentaje: 250, tope: 300000, rollover: 40, base: 'bono' }).bono, 'ARS 300.000, es el tope');
});

test('rollover 4: 55x sobre depósito + bono en 5 días', () => {
  // bono = 40.000; base = 40.000 + 40.000 = 80.000; total = 80.000 x 55 = 4.400.000; por día = 4.400.000 / 5 = 880.000; giros de 1.000 = 4.400
  const e = { deposito: 40000, porcentaje: 100, rollover: 55, base: 'suma', dias: 5, apuesta: 1000 };
  const c = calcularRollover(e);
  assert.equal(c.baseMonto, 80000);
  assert.equal(c.total, 4400000);
  assert.equal(c.porDia, 880000);
  assert.equal(c.giros, 4400);
  assert.equal(textoRollover(e).veredicto,
    'Con un rollover de 55x sobre depósito + bono tenés que apostar ARS 4.400.000, ARS 880.000 por día durante 5 días; son 4.400 giros de ARS 1.000.');
});

test('rollover 5: 30x sobre el depósito en 10 días', () => {
  // base = 40.000; total = 40.000 x 30 = 1.200.000; por día = 1.200.000 / 10 = 120.000
  const c = calcularRollover({ deposito: 40000, porcentaje: 100, rollover: 30, base: 'deposito', dias: 10 });
  assert.equal(c.baseMonto, 40000);
  assert.equal(c.total, 1200000);
  assert.equal(c.porDia, 120000);
});

test('rollover 6: 25x sobre depósito + bono en 15 días, por día con redondeo', () => {
  // total = 80.000 x 25 = 2.000.000; por día = 2.000.000 / 15 = 133.333,33; se muestra ARS 133.333
  const e = { deposito: 40000, porcentaje: 100, rollover: 25, base: 'suma', dias: 15 };
  const c = calcularRollover(e);
  assert.equal(c.total, 2000000);
  cerca(c.porDia, 133333.3333333333);
  assert.equal(textoRollover(e).veredicto,
    'Con un rollover de 25x sobre depósito + bono tenés que apostar ARS 2.000.000, ARS 133.333 por día durante 15 días.');
});

test('rollover 7: los giros se redondean para arriba', () => {
  // total = 700.000; 700.000 / 300 = 2.333,33; hacen falta 2.334 giros
  const e = { deposito: 20000, porcentaje: 100, rollover: 35, base: 'bono', apuesta: 300 };
  assert.equal(calcularRollover(e).giros, 2334);
  assert.equal(textoRollover(e).giros, '2.334 giros de ARS 300');
});

test('rollover 8: faltan datos o no hay nada que apostar', () => {
  // sin depósito no hay cuenta
  let t = textoRollover({ porcentaje: 100, rollover: 35, base: 'bono' });
  assert.equal(t.bono, 'cargá el depósito');
  assert.equal(t.total, 'ARS 0');
  assert.equal(t.giros, 'cargá la apuesta promedio');
  assert.equal(t.veredicto, 'Cargá el depósito y el rollover para ver cuánto hay que apostar.');
  // sin rollover tampoco: total = 20.000 x 0 = 0
  assert.equal(textoRollover({ deposito: 20000, porcentaje: 100, base: 'bono' }).veredicto,
    'Cargá el depósito y el rollover para ver cuánto hay que apostar.');
  // bono de 0 % sobre el bono: total = 0 x 35 = 0
  t = textoRollover({ deposito: 20000, porcentaje: 0, rollover: 35, base: 'bono' });
  assert.equal(t.bono, 'ARS 0');
  assert.equal(t.veredicto, 'Con estos datos no hay nada que apostar: revisá el porcentaje del bono y la base del rollover.');
  // el mismo 0 % con base depósito sí da cuenta: 20.000 x 35 = 700.000
  assert.equal(calcularRollover({ deposito: 20000, porcentaje: 0, rollover: 35, base: 'deposito' }).total, 700000);
});

test('rollover 9: lectura y formato de números', () => {
  assert.equal(leerNumero('20.000'), 20000);   // el punto es de miles
  assert.equal(leerNumero('12,5'), 12.5);      // la coma es decimal
  assert.equal(leerNumero('1.5'), 15);         // un punto nunca es decimal en esta calculadora
  assert.equal(leerNumero(' 1 000 '), 1000);
  assert.equal(leerNumero(''), 0);
  assert.equal(leerNumero('-5'), 0);
  assert.equal(leerNumero('abc'), 0);
  assert.equal(miles(1234567.6), '1.234.568'); // redondea a 1.234.568
  assert.equal(miles(999), '999');
  assert.equal(veces(35), '35x');
  assert.equal(veces(37.5), '37,5x');
});

test('rollover 10: plazo de 1 día y rollover con decimales', () => {
  // bono = 10.000 x 50 / 100 = 5.000; total = 5.000 x 37,5 = 187.500; por día = 187.500 / 1
  const e = { deposito: 10000, porcentaje: 50, rollover: 37.5, base: 'bono', dias: 1 };
  assert.equal(calcularRollover(e).total, 187500);
  assert.equal(textoRollover(e).veredicto,
    'Con un rollover de 37,5x sobre el bono tenés que apostar ARS 187.500, ARS 187.500 por día durante 1 día.');
});

/* ---------------- saldo ---------------- */

test('saldo 1: ARS 20.000 a ARS 200 por giro con RTP 96 % y 10 giros por minuto', () => {
  // pérdida = 200 x (1 - 0,96) = 8; giros = 20.000 / 8 = 2.500; tiempo = 2.500 / 10 = 250 min = 4 h 10 min
  const e = { saldo: 20000, apuesta: 200, rtp: 96, girosPorMinuto: 10 };
  const c = calcularSaldo(e);
  assert.equal(c.estado, 'ok');
  cerca(c.perdidaPorGiro, 8);
  cerca(c.giros, 2500);
  assert.equal(c.girosRedondeados, 2500);
  cerca(c.minutos, 250);
  const t = textoSaldo(e);
  assert.equal(t.perdida, 'ARS 8');
  assert.equal(t.giros, '2.500');
  assert.equal(t.tiempo, '4 h 10 min');
  assert.equal(t.veredicto,
    'Con RTP 96 %, cada giro de ARS 200 pierde en promedio ARS 8. El saldo de ARS 20.000 alcanza en promedio para 2.500 giros. A 10 giros por minuto, el tiempo promedio es 4 h 10 min.');
});

test('saldo 2: RTP 99 %', () => {
  // pérdida = 200 x 0,01 = 2; giros = 20.000 / 2 = 10.000; tiempo = 10.000 / 10 = 1.000 min = 16 h 40 min
  const t = textoSaldo({ saldo: 20000, apuesta: 200, rtp: 99, girosPorMinuto: 10 });
  assert.equal(t.perdida, 'ARS 2');
  assert.equal(t.giros, '10.000');
  assert.equal(t.tiempo, '16 h 40 min');
});

test('saldo 3: RTP 97 %, giros con decimales', () => {
  // pérdida = 200 x 0,03 = 6; giros = 20.000 / 6 = 3.333,33, se muestran 3.333; tiempo = 333,33 min, se redondea a 333 = 5 h 33 min
  const e = { saldo: 20000, apuesta: 200, rtp: 97, girosPorMinuto: 10 };
  const c = calcularSaldo(e);
  cerca(c.perdidaPorGiro, 6);
  assert.equal(c.girosRedondeados, 3333);
  assert.equal(textoSaldo(e).tiempo, '5 h 33 min');
});

test('saldo 4: RTP 94 %, redondeo para arriba', () => {
  // pérdida = 200 x 0,06 = 12; giros = 20.000 / 12 = 1.666,67, se muestran 1.667; tiempo = 166,67 min, se redondea a 167 = 2 h 47 min
  const t = textoSaldo({ saldo: 20000, apuesta: 200, rtp: 94, girosPorMinuto: 10 });
  assert.equal(t.perdida, 'ARS 12');
  assert.equal(t.giros, '1.667');
  assert.equal(t.tiempo, '2 h 47 min');
});

test('saldo 5: RTP con decimales y pérdida con centavos', () => {
  // pérdida = 150 x (1 - 0,965) = 5,25; giros = 10.000 / 5,25 = 1.904,76, se muestran 1.905; tiempo = 1.904,76 / 8 = 238,1 min = 3 h 58 min
  const e = { saldo: 10000, apuesta: 150, rtp: 96.5, girosPorMinuto: 8 };
  const c = calcularSaldo(e);
  cerca(c.perdidaPorGiro, 5.25);
  assert.equal(c.girosRedondeados, 1905);
  const t = textoSaldo(e);
  assert.equal(t.perdida, 'ARS 5,25');
  assert.equal(t.tiempo, '3 h 58 min');
  assert.ok(t.veredicto.startsWith('Con RTP 96,5 %, cada giro de ARS 150 pierde en promedio ARS 5,25.'));
});

test('saldo 6: la apuesta es mayor que el saldo', () => {
  // 200 > 100: no alcanza para un giro
  const e = { saldo: 100, apuesta: 200, rtp: 96, girosPorMinuto: 10 };
  assert.equal(calcularSaldo(e).estado, 'apuesta-mayor');
  assert.equal(textoSaldo(e).veredicto, 'La apuesta por giro, ARS 200, es mayor que el saldo, ARS 100. No alcanza para un giro.');
  // saldo igual a la apuesta sí alcanza: pérdida = 200 x 0,04 = 8; giros = 200 / 8 = 25
  assert.equal(calcularSaldo({ saldo: 200, apuesta: 200, rtp: 96 }).girosRedondeados, 25);
});

test('saldo 7: RTP fuera de rango o datos sin cargar', () => {
  assert.equal(calcularSaldo({ saldo: 20000, apuesta: 200, rtp: 100 }).estado, 'rtp-invalido'); // con 100 % no hay pérdida esperada
  assert.equal(calcularSaldo({ saldo: 20000, apuesta: 200, rtp: 120 }).estado, 'rtp-invalido');
  assert.equal(calcularSaldo({ saldo: 20000, apuesta: 200, rtp: NaN }).estado, 'rtp-invalido');
  assert.equal(calcularSaldo({ saldo: 20000, apuesta: 200, rtp: null }).estado, 'faltan-datos');
  assert.equal(calcularSaldo({ saldo: null, apuesta: 200, rtp: 96 }).estado, 'faltan-datos');
  assert.equal(calcularSaldo({ saldo: 20000, apuesta: 0, rtp: 96 }).estado, 'faltan-datos');
  const t = textoSaldo({ saldo: 20000, apuesta: 200 });
  assert.equal(t.perdida, 'cargá los datos');
  assert.equal(t.veredicto, 'Cargá el saldo, la apuesta por giro y el RTP para hacer la cuenta.');
});

test('saldo 8: sin giros por minuto no hay tiempo', () => {
  // pérdida = 8 y giros = 2.500 como en el caso 1; el tiempo queda sin calcular
  const e = { saldo: 20000, apuesta: 200, rtp: 96 };
  assert.equal(calcularSaldo(e).minutos, null);
  const t = textoSaldo(e);
  assert.equal(t.giros, '2.500');
  assert.equal(t.tiempo, 'cargá los giros por minuto');
  assert.equal(t.veredicto, 'Con RTP 96 %, cada giro de ARS 200 pierde en promedio ARS 8. El saldo de ARS 20.000 alcanza en promedio para 2.500 giros.');
  // más de 1.000 giros por minuto no se acepta
  assert.equal(calcularSaldo({ ...e, girosPorMinuto: 1001 }).minutos, null);
});

test('saldo 9: RTP 0 % y un solo giro', () => {
  // pérdida = 100 x (1 - 0) = 100; giros = 100 / 100 = 1; tiempo = 1 / 30 = 0,03 min, menos de 1 min
  const e = { saldo: 100, apuesta: 100, rtp: 0, girosPorMinuto: 30 };
  const c = calcularSaldo(e);
  assert.equal(c.perdidaPorGiro, 100);
  assert.equal(c.girosRedondeados, 1);
  const t = textoSaldo(e);
  assert.equal(t.tiempo, 'menos de 1 min');
  assert.equal(t.veredicto,
    'Con RTP 0 %, cada giro de ARS 100 pierde en promedio ARS 100. El saldo de ARS 100 alcanza en promedio para 1 giro. A 30 giros por minuto, el tiempo promedio es menos de 1 min.');
});

test('saldo 10: duración en texto', () => {
  assert.equal(duracion(0.4), 'menos de 1 min'); // redondea a 0
  assert.equal(duracion(0.5), '1 min');          // redondea a 1
  assert.equal(duracion(45), '45 min');
  assert.equal(duracion(59.5), '1 h');           // redondea a 60 min
  assert.equal(duracion(60), '1 h');
  assert.equal(duracion(250), '4 h 10 min');     // 250 = 4 x 60 + 10
  assert.equal(duracion(100000), '1.666 h 40 min'); // 100.000 = 1.666 x 60 + 40
});

/* ---------------- cuotas ---------------- */

test('cuotas 1: dos selecciones a 1,80 y 2,10 con ARS 20.000', () => {
  // combinada = 1,80 x 2,10 = 3,78; pago = 20.000 x 3,78 = 75.600; neta = 75.600 - 20.000 = 55.600; probabilidad = 1 / 3,78 = 26,46 %
  const e = { cuotas: [1.8, 2.1], monto: 20000 };
  const c = calcularCuotas(e);
  assert.equal(c.estado, 'ok');
  assert.equal(c.n, 2);
  cerca(c.combinada, 3.78);
  cerca(c.pago, 75600);
  cerca(c.neta, 55600);
  cerca(c.probabilidad, 1 / 3.78);
  const t = textoCuotas(e);
  assert.deepEqual(t.filas, ['55,56 %', '47,62 %']); // 1 / 1,80 = 55,56 %; 1 / 2,10 = 47,62 %
  assert.equal(t.combinada, '3,78');
  assert.equal(t.probabilidad, '26,46 %');
  assert.equal(t.pago, 'ARS 75.600');
  assert.equal(t.neta, 'ARS 55.600');
  assert.equal(t.veredicto,
    'Con ARS 20.000 a cuota 3,78 el pago posible es ARS 75.600, con ARS 55.600 de ganancia neta si se cumplen las 2 selecciones.');
});

test('cuotas 2: una sola selección', () => {
  // pago = 1.000 x 1,85 = 1.850; neta = 850; probabilidad = 1 / 1,85 = 54,05 %
  const t = textoCuotas({ cuotas: [1.85], monto: 1000 });
  assert.equal(t.combinada, '1,85');
  assert.equal(t.probabilidad, '54,05 %');
  assert.equal(t.veredicto, 'Con ARS 1.000 a cuota 1,85 el pago posible es ARS 1.850, con ARS 850 de ganancia neta si se cumple la selección.');
});

test('cuotas 3: tres selecciones y filas vacías', () => {
  // combinada = 1,5 x 2 x 2,5 = 7,5; pago = 1.000 x 7,5 = 7.500; neta = 6.500; probabilidad = 1 / 7,5 = 13,33 %
  const e = { cuotas: [1.5, null, 2, 2.5, null], monto: 1000 };
  const c = calcularCuotas(e);
  assert.equal(c.n, 3);
  assert.equal(c.combinada, 7.5);
  assert.equal(c.pago, 7500);
  assert.equal(c.neta, 6500);
  const t = textoCuotas(e);
  assert.equal(t.filas[1], 'sin cuota');
  assert.equal(t.combinada, '7,50');
  assert.equal(t.probabilidad, '13,33 %');
  assert.ok(t.veredicto.endsWith('si se cumplen las 3 selecciones.'));
});

test('cuotas 4: pago con centavos', () => {
  // combinada = 1,85 x 1,91 = 3,5335; pago = 1.500 x 3,5335 = 5.300,25; neta = 3.800,25
  const t = textoCuotas({ cuotas: [1.85, 1.91], monto: 1500 });
  assert.equal(t.combinada, '3,5335');
  assert.equal(t.pago, 'ARS 5.300,25');
  assert.equal(t.neta, 'ARS 3.800,25');
});

test('cuotas 5: lectura de cuotas decimales', () => {
  assert.equal(leerCuota('1,85'), 1.85);
  assert.equal(leerCuota('1.85'), 1.85);      // un solo separador siempre es decimal
  assert.equal(leerCuota(' 2 '), 2);
  assert.equal(leerCuota(''), null);
  assert.ok(Number.isNaN(leerCuota('1')));    // tiene que ser mayor que 1
  assert.ok(Number.isNaN(leerCuota('0,9')));
  assert.ok(Number.isNaN(leerCuota('abc')));
  assert.ok(Number.isNaN(leerCuota('1.000.001'))); // más de 1e6
});

test('cuotas 6: lectura de cuotas fraccionarias y americanas', () => {
  assert.equal(leerCuota('5/2', 'fra'), 3.5);   // 1 + 5 / 2
  assert.equal(leerCuota('1/2', 'fra'), 1.5);   // 1 + 1 / 2
  assert.equal(leerCuota('5', 'fra'), 6);       // sin barra es 5/1
  assert.ok(Number.isNaN(leerCuota('5/0', 'fra')));
  assert.ok(Number.isNaN(leerCuota('1/2/3', 'fra')));
  assert.equal(leerCuota('+150', 'ame'), 2.5);  // 1 + 150 / 100
  assert.equal(leerCuota('150', 'ame'), 2.5);
  assert.equal(leerCuota('-200', 'ame'), 1.5);  // 1 + 100 / 200
  assert.equal(leerCuota('−200', 'ame'), 1.5); // signo menos tipográfico
  assert.ok(Number.isNaN(leerCuota('+50', 'ame'))); // de 100 para arriba
});

test('cuotas 7: paso entre formatos', () => {
  assert.equal(cuotaTexto(2.5, 'dec'), '2,50');
  assert.equal(cuotaTexto(2.5, 'fra'), '3/2');   // 2,5 - 1 = 1,5 = 3/2
  assert.equal(cuotaTexto(2.5, 'ame'), '+150');  // (2,5 - 1) x 100
  assert.equal(cuotaTexto(1.5, 'ame'), '-200');  // 100 / (1,5 - 1)
  assert.equal(cuotaTexto(2, 'ame'), '+100');
  assert.equal(cuotaTexto(3.78, 'fra'), '139/50'); // 2,78 = 139/50
  assert.equal(cuotaTexto(3.78, 'ame'), '+278');
  // 0,14159… no tiene fracción exacta con denominador hasta 1.000; la mejor es 16/113
  assert.equal(cuotaTexto(Math.PI - 2, 'fra'), '≈ 16/113');
  assert.equal(cuotaTexto(Math.PI - 2, 'fra', true), '16/113');
});

test('cuotas 8: fracciones continuas', () => {
  assert.deepEqual(fraccion(0.5), { p: 1, q: 2, exacta: true });
  assert.deepEqual(fraccion(1 / 3), { p: 1, q: 3, exacta: true });
  assert.deepEqual(fraccion(2.5), { p: 5, q: 2, exacta: true });
  assert.deepEqual(fraccion(4), { p: 4, q: 1, exacta: true });
  const f = fraccion(Math.PI - 3); // convergentes 1/7, 15/106, 16/113; la siguiente pasa de 1.000
  assert.equal(f.p + '/' + f.q, '16/113');
  assert.equal(f.exacta, false);
});

test('cuotas 9: cuota no válida, sin cuotas y sin monto', () => {
  let c = calcularCuotas({ cuotas: [1.8, NaN, 2], monto: 1000 });
  assert.equal(c.estado, 'cuota-invalida');
  assert.equal(c.invalida, 2);
  let t = textoCuotas({ cuotas: [1.8, NaN, 2], monto: 1000 });
  assert.deepEqual(t.filas, ['55,56 %', 'no válida', '50 %']);
  assert.equal(t.pago, 'cargá las cuotas');
  assert.equal(t.veredicto, 'Revisá la selección 2: la cuota decimal es un número mayor que 1, como 1,85.');
  assert.equal(calcularCuotas({ cuotas: [null, null], monto: 1000 }).estado, 'sin-cuotas');
  assert.equal(textoCuotas({ cuotas: [], monto: 1000 }).veredicto, 'Cargá al menos una cuota para calcular.');
  // combinada = 2 x 3 = 6; probabilidad = 1 / 6 = 16,67 %; sin monto no hay pago
  c = calcularCuotas({ cuotas: [2, 3] });
  assert.equal(c.estado, 'sin-monto');
  assert.equal(c.combinada, 6);
  assert.equal(c.pago, null);
  t = textoCuotas({ cuotas: [2, 3] });
  assert.equal(t.pago, 'cargá el monto');
  assert.equal(t.veredicto, 'Cuota combinada 6,00, probabilidad implícita 16,67 %. Cargá el monto para ver el pago posible.');
});

/* ---------------- números ---------------- */

test('números: lectura y formato es-AR', () => {
  assert.equal(AR.leer('20.000', 'mon'), 20000);         // en modo monto, «20.000» son veinte mil
  assert.equal(AR.leer('20.000', 'dec'), 20);            // en modo decimal, un solo separador es decimal
  assert.equal(AR.leer('1.85', 'mon'), 1.85);            // no tiene forma de miles
  assert.equal(AR.leer('1.234.567,5', 'mon'), 1234567.5);
  assert.equal(AR.leer('', 'mon'), null);
  assert.ok(Number.isNaN(AR.leer('12a', 'mon')));
  assert.ok(Number.isNaN(AR.leer('1,2,3', 'mon')));
  assert.equal(AR.fmt(1234567.5, 0, 2), '1.234.567,5');
  assert.equal(AR.monto(5300.25), '5.300,25');
  assert.equal(AR.monto(8.000000000000007), '8');
  assert.equal(AR.plata(20000), 'ARS 20.000');
  assert.equal(AR.pct(0.2645502645502645), '26,46 %');
  assert.equal(AR.pct(0.00005), '< 0,01 %');
  assert.equal(numeros('es-CL', 'CLP').pago(1234.56), 'CLP 1.235'); // moneda sin centavos
});
