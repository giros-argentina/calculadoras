# Giros Calculadoras

Tres calculadoras en JavaScript, sin dependencias y sin acceso al DOM. Hacen las mismas cuentas que las herramientas de [Giros Argentina](https://girosargentina.com/). Los números van como en Argentina, con punto de miles y coma decimal.

En el sitio están como [calculadora de rollover](https://girosargentina.com/herramientas/calculadora-de-rollover/), [cuánto dura tu saldo](https://girosargentina.com/herramientas/cuanto-dura-tu-saldo/) y [calculadora de cuotas](https://girosargentina.com/herramientas/calculadora-de-cuotas/).

## Rollover de un bono

```
bono = depósito x porcentaje / 100 (si supera el tope, queda el tope)
base = el bono, depósito + bono o el depósito
total a apostar = base x rollover
giros = total / apuesta promedio, redondeado para arriba
por día = total / días de plazo
```

Ejemplo. Depósito de ARS 40.000, bono del 100 %, rollover de 25x sobre depósito + bono, 15 días. Base, 40.000 + 40.000 = 80.000. Total, 80.000 x 25 = ARS 2.000.000. Por día, ARS 133.333.

## Cuánto dura un saldo

Promedio matemático para tragamonedas. Una sesión real puede durar mucho menos o mucho más.

```
pérdida esperada por giro = apuesta x (1 - RTP / 100)
giros esperados = saldo / pérdida por giro
tiempo promedio = giros / giros por minuto
```

Ejemplo. Saldo de ARS 20.000, apuesta de ARS 200, RTP de 96 %, 10 giros por minuto. Pérdida por giro, 200 x 0,04 = ARS 8. Giros, 20.000 / 8 = 2.500. Tiempo, 250 min, o sea 4 h 10 min.

## Cuotas combinadas

Lee cuotas decimales, fraccionarias y americanas.

```
cuota combinada = cuota 1 x cuota 2 x ...
pago posible = monto x cuota combinada
ganancia neta = pago posible - monto
probabilidad implícita = 1 / cuota
```

Ejemplo. Cuotas 1,80 y 2,10 con ARS 20.000. Cuota combinada, 1,80 x 2,10 = 3,78. Pago posible, ARS 75.600. Ganancia neta, ARS 55.600. Probabilidad implícita, 26,46 %.

## Uso como módulo

Se instala con `npm install giros-calculadoras`.

```js
import { calcularRollover, calcularSaldo, leerCuota } from 'giros-calculadoras';

calcularRollover({ deposito: 40000, porcentaje: 100, rollover: 25, base: 'suma' }).total; // 2000000
calcularSaldo({ saldo: 20000, apuesta: 200, rtp: 96 }).girosRedondeados; // 2500
leerCuota('+150', 'ame'); // 2.5
```

Las funciones `calcular…` trabajan con números. Las `texto…` devuelven el resultado escrito en español. Las pruebas corren con `node --test`.

## Uso como página

`index.html` es una demo con las tres calculadoras. Importa los módulos de `src/`, así que se abre desde un servidor local, por ejemplo `python3 -m http.server 8000`.

La carpeta `codepen/` del repositorio tiene la calculadora de rollover en tres archivos sin imports, para pegar en CodePen o JSFiddle.

## Licencia

MIT. Si reutilizás el código o las fórmulas, citá la fuente como «Giros Argentina (girosargentina.com)».

Contenido para mayores de 18 años. Líneas de ayuda en [juego responsable](https://girosargentina.com/juego-responsable/).
