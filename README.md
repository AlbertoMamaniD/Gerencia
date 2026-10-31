# ⚡ AhorraTech — Control de energía y presupuesto

[![CI](https://github.com/AlbertoMamaniD/Gerencia/actions/workflows/ci.yml/badge.svg)](https://github.com/AlbertoMamaniD/Gerencia/actions/workflows/ci.yml)

Aplicación móvil (Android / iOS) para controlar el consumo eléctrico del hogar y el gasto en bolivianos (Bs) en tiempo real. Se conecta a un **ESP32 + sensor PZEM-004T** y permite calibrar la lectura con una **foto del medidor** (OCR con Google Gemini).

---

## Funcionalidades

| Pantalla | Qué hace |
|---|---|
| **Inicio** | Gasto del ciclo en Bs, progreso del presupuesto, proyección al cierre, potencia en vivo, mediciones eléctricas (V, A, Hz, cos φ), lectura del medidor e historial de 7 días. |
| **Escanear** | Foto del medidor (cámara o galería) → lectura automática → el usuario **revisa y corrige** antes de calibrar. Funciona también con ingreso manual. Respaldo opcional en Supabase. |
| **Presupuesto** | Presupuesto mensual, aviso anticipado (70–90 %) y límite de sobrecarga en W, con validación. |
| **Ajustes** | Tema (sistema / claro / oscuro), fuente de datos (simulación / ESP32), tarifa y día de inicio del ciclo, estado de servicios en la nube, notificación de prueba y reinicio de ciclo. |

Alertas en la app y notificaciones locales por **sobrecarga**, **presupuesto cerca del límite** y **presupuesto agotado**, con espera anti-spam por tipo.

---

## Diseño

- **Identidad:** azul marino profundo + cian eléctrico, derivados del logotipo. Tarjeta principal en azul marino; superficies claras para leer datos.
- **Modo claro y oscuro** (sigue al sistema o se elige en Ajustes).
- **Tipografía:** Inter (400/500/600/700) con números tabulares para valores en vivo.
- **Accesibilidad:** contraste WCAG 2.2 AA verificado por pruebas automáticas en ambos temas, áreas táctiles ≥ 48 dp, etiquetas para lectores de pantalla, estados que no dependen solo del color, soporte de tamaño de fuente del sistema y de "reducir movimiento".
- **Responsive:** probado de 320 dp a tablets (ancho máximo de contenido 640 dp). En pantallas < 360 dp los encabezados y la tarjeta principal usan un diseño compacto.

---

## Stack

| Área | Tecnología |
|---|---|
| Framework | Expo SDK 58 · React Native 0.88 · React 19.3 |
| Navegación | Expo Router (rutas en `src/app/`) |
| Lenguaje | TypeScript 6 (strict) |
| Estado | Zustand 4 + AsyncStorage (escritura agrupada para ahorrar batería) |
| Gráficos | react-native-gifted-charts · react-native-svg |
| Animación | Reanimated 4 |
| Pruebas | Jest (jest-expo) · Testing Library for React Native 14 |
| Calidad | ESLint (eslint-config-expo) · expo-doctor · GitHub Actions |

---

## Estructura

```
src/
├── app/                 # Rutas (Expo Router): solo composición de pantallas
│   ├── (tabs)/          # Inicio, Escanear, Presupuesto, Ajustes
│   └── _layout.tsx      # Fuentes, splash, tema y servicios globales
├── components/
│   ├── ui/              # Sistema de diseño: AppText, Button, Card, TextField, Banner…
│   ├── layout/          # Screen, ScreenHeader, ConnectionPill, ErrorBoundary
│   ├── dashboard/       # BudgetHeroCard, LivePowerCard, TelemetryGrid, WeeklyConsumptionCard
│   └── scanner/         # Viewfinder, ReadingReviewCard, CaptureHistory, ScanSteps
├── domain/              # Lógica pura y probada: facturación, medidor, alertas, validación
├── services/            # ESP32, simulador, OCR (Gemini), Supabase, notificaciones
├── store/               # Store global, migraciones y almacenamiento agrupado
├── hooks/               # Lectura periódica, notificaciones, flujo del escáner, datos derivados
├── theme/               # Tokens, temas claro/oscuro, utilidades de color
├── config/              # Variables de entorno públicas
└── utils/               # Formatos en español (Bs, kWh, fechas)
```

### Modelo del medidor

La app separa la lectura cruda del sensor de la lectura del medidor:

- Cada lectura nueva suma solo la **diferencia** respecto a la anterior (un reinicio del sensor o un cambio de fuente no generan saltos).
- **Calibrar** con foto ajusta la lectura al medidor real **sin alterar el consumo ya medido del ciclo**.
- El **gasto del ciclo** = (lectura actual − lectura al inicio del ciclo) × tarifa.

---

## Desarrollo

```bash
npm install            # instalar dependencias
cp .env.example .env   # configurar claves (opcional)
npm start              # servidor de desarrollo (Expo Go o development build)
```

| Script | Descripción |
|---|---|
| `npm run typecheck` | Verificación de tipos |
| `npm run lint` | ESLint |
| `npm test` | Pruebas |
| `npm run test:ci` | Pruebas con cobertura (umbral ≥ 90 % en `domain/` y `utils/`) |
| `npm run verify` | Todo lo anterior |
| `npm run doctor` | Diagnóstico de dependencias de Expo |

> **Windows:** si tu sistema tiene `NODE_ENV=production` como variable global, `npm install` omite las dependencias de desarrollo. Usa `npm install --include=dev`.

### Variables de entorno

| Variable | Uso |
|---|---|
| `EXPO_PUBLIC_GEMINI_API_KEY` | Lectura automática del medidor (opcional; sin ella se ingresa a mano). |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Respaldo de fotos y calibraciones (opcional). |

⚠️ Las variables `EXPO_PUBLIC_*` quedan dentro del APK. Usa una clave de Gemini con restricciones de uso y la anon key de Supabase con RLS activo (ver `supabase/schema.sql`).

---

## CI/CD

- **`ci.yml`** (push y PR a `main`/`develop`): tipos → lint sin warnings → pruebas con cobertura (zona horaria de Bolivia) → expo-doctor → exportación del bundle Android y web.
- **`eas-build.yml`** (manual): genera el APK en EAS. Requiere el secreto `EXPO_TOKEN`.

Guía detallada de ejecución y compilación: [COMO_HACER_CORRER_Y_COMPILAR.md](./COMO_HACER_CORRER_Y_COMPILAR.md).

---

## Integración con el ESP32

En **Ajustes → Fuente de datos → ESP32** se configura la IP. La app consulta cada 2 s:

```http
GET http://<ESP32_IP>/api/telemetry

{ "voltage": 221.4, "current": 2.35, "power": 520.3, "energy": 142.85, "frequency": 50.0, "pf": 0.96 }
```

`power` y `energy` son obligatorios; `powerFactor` o `pf` son equivalentes.

---

## Licencia

Proyecto desarrollado para la materia de Taller de Grado / Gerencia Tecnológica. Todos los derechos reservados.
