/* Calculadora de rollover. Pegá este bloque en el panel JS. Sin bibliotecas.
   bono = depósito x porcentaje / 100, con tope opcional.
   total = base x rollover; la base es el bono, depósito + bono o el depósito.
   Hecho por Giros Argentina (girosargentina.com). Licencia MIT. */
(function () {
  'use strict';
  var BASES = { bono: 'sobre el bono', suma: 'sobre depósito + bono', deposito: 'sobre el depósito' };

  // Texto a número: el punto es separador de miles y la coma es decimal. Vacío, texto o negativo dan 0.
  function leerNumero(txt) {
    var t = String(txt || '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    var n = parseFloat(t);
    return isFinite(n) && n > 0 ? n : 0;
  }
  // Entero redondeado con punto de miles.
  function miles(n) {
    n = Math.round(n);
    var s = String(Math.abs(n)), out = '';
    while (s.length > 3) { out = '.' + s.slice(-3) + out; s = s.slice(0, -3); }
    return (n < 0 ? '-' : '') + s + out;
  }
  function ars(n) { return 'ARS ' + miles(n); }
  function veces(n) { return String(Math.round(n * 100) / 100).replace('.', ',') + 'x'; }

  // Cuenta pura: recibe números y devuelve números.
  function calcularRollover(e) {
    var d = e.deposito, bono = d * e.porcentaje / 100, conTope = false;
    if (e.tope > 0 && bono > e.tope) { bono = e.tope; conTope = true; }
    var baseMonto = e.base === 'suma' ? d + bono : e.base === 'deposito' ? d : bono;
    var total = baseMonto * e.rollover;
    return {
      bono: bono, conTope: conTope, total: total,
      giros: total > 0 && e.apuesta > 0 ? Math.ceil(total / e.apuesta) : null,
      porDia: total > 0 && e.dias > 0 ? total / e.dias : null
    };
  }

  function $(id) { return document.getElementById(id); }
  var dep = $('r-dep'), pct = $('r-pct'), tope = $('r-tope'), roll = $('r-roll'), base = $('r-base'), ap = $('r-ap'), dias = $('r-dias');
  var oBono = $('r-o-bono'), oTotal = $('r-o-total'), oGiros = $('r-o-giros'), oV = $('r-v');

  function pintar() {
    var e = {
      deposito: leerNumero(dep.value), porcentaje: leerNumero(pct.value), tope: leerNumero(tope.value),
      rollover: leerNumero(roll.value), base: base.value, apuesta: leerNumero(ap.value), dias: leerNumero(dias.value)
    };
    var c = calcularRollover(e);
    oBono.textContent = e.deposito > 0 ? ars(c.bono) + (c.conTope ? ', es el tope' : '') : 'cargá el depósito';
    oTotal.textContent = c.total > 0 ? ars(c.total) : 'ARS 0';
    oGiros.textContent = c.giros !== null ? miles(c.giros) + ' giros de ' + ars(e.apuesta) : 'cargá la apuesta promedio';
    if (!(e.deposito > 0) || !(e.rollover > 0)) { oV.textContent = 'Cargá el depósito y el rollover para ver cuánto hay que apostar.'; return; }
    if (!(c.total > 0)) { oV.textContent = 'Con estos datos no hay nada que apostar: revisá el porcentaje del bono y la base del rollover.'; return; }
    var v = 'Con un rollover de ' + veces(e.rollover) + ' ' + (BASES[e.base] || BASES.bono) + ' tenés que apostar ' + ars(c.total);
    if (c.porDia !== null) v += ', ' + ars(c.porDia) + ' por día durante ' + miles(e.dias) + (e.dias === 1 ? ' día' : ' días');
    if (c.giros !== null) v += '; son ' + miles(c.giros) + ' giros de ' + ars(e.apuesta);
    oV.textContent = v + '.';
  }

  [dep, pct, tope, roll, ap, dias].forEach(function (el) {
    el.addEventListener('input', pintar);
    el.addEventListener('blur', function () { // los montos quedan con punto de miles al salir del campo
      var n = leerNumero(el.value);
      if (n > 0 && el.getAttribute('inputmode') === 'numeric') el.value = miles(n);
    });
  });
  base.addEventListener('change', pintar);
  pintar();
})();
