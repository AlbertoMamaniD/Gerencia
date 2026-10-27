# ⚡ AhorraTech — Smart Energy & Budget Control App

> **Aplicación móvil de telemetría eléctrica residencial y control presupuestario en tiempo real (Bolivianos `Bs`)** diseñada para integrarse con microcontroladores **ESP32 + sensor PZEM-004T**, con calibración óptica mediante escáner de fotos de medidor eléctrico y consola FinTech de alta fidelidad.

---

## 📱 Capturas & Visión General de la Interfaz

- **Consola Maestra de Presupuesto (FinTech Cockpit):** Seguimiento en tiempo real de facturación acumulada en `Bs`, micro-gauge SVG dinámico, proyección matemática de fin de ciclo y ritmo diario.
- **Matriz de Telemetría Eléctrica PZEM-004T:** Lectura instantánea de Tensión (V), Corriente (A), Frecuencia (Hz), Factor de Potencia ($\cos \varphi$) y Energía activa total (kWh).
- **Escáner Fotográfico y OCR de Medidor:** Captura desde cámara o galería para lectura de displays analógicos/digitales y sincronización inmediata de acumuladores.
- **Deck de Analíticas Interactivo:** Alternancia táctil con Haptics entre la curva continua de potencia activa (Watts) y el historial comparativo de 7 días con meta diaria.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología / Versión |
|---|---|
| **Framework Móvil** | [React Native 0.88.0](https://reactnative.dev/) / [Expo SDK 58](https://expo.dev/) |
| **Enrutador & Navegación** | [Expo Router ~58.0.27](https://docs.expo.dev/router/introduction/) |
| **Lenguaje** | [TypeScript ~6.0.3](https://www.typescriptlang.org/) (Strict Mode) |
| **Gestor de Estado** | [Zustand ^4.5.5](https://github.com/pmndrs/zustand) (RAM + AsyncStorage) |
| **Animaciones & Gráficos** | [React Native Reanimated 4.7.1](https://docs.swmansion.com/react-native-reanimated/) & [react-native-svg 15.16.0](https://github.com/software-mansion/react-native-svg) |
| **Estilos** | NativeWind v4 + TailwindCSS + Vanilla React Native StyleSheet modular |
| **Cámara & OCR** | [expo-image-picker ~58.0.10](https://docs.expo.dev/versions/latest/sdk/imagepicker/) |
| **Feedback Táctil** | [expo-haptics ~58.0.7](https://docs.expo.dev/versions/latest/sdk/haptics/) |

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js >= 18
- Dispositivo móvil con **Expo Go** o emulador Android/iOS

### Pasos
```bash
# 1. Clonar el repositorio
git clone https://github.com/AlbertoMamaniD/Gerencia.git
cd Gerencia

# 2. Instalar dependencias compatibles con Expo SDK 58
npm install

# 3. Iniciar el servidor de desarrollo Expo
npx expo start
```

Escanea el código QR desde la app **Expo Go** en tu dispositivo móvil.

---

## 🔌 Especificación de Integración de Hardware (ESP32)

La aplicación soporta dos modos de operación configurables desde la pestaña **Ajustes**:
1. **Modo Simulación:** Generador estocástico gaussiano de cargas residenciales (refrigerador, iluminación, horno microondas, picos de arranque).
2. **Modo Hardware Real:** Polling HTTP REST cada 2000 ms a la IP del microcontrolador:

```http
GET http://<ESP32_IP>/api/telemetry
Content-Type: application/json

{
  "voltage": 221.4,
  "current": 2.35,
  "power": 520.3,
  "energy": 142.85,
  "frequency": 50.0,
  "pf": 0.96,
  "timestamp": 1729864200000
}
```

---

## 📁 Estructura del Proyecto

```
c:/GERENCIA/
├── app/                      # Rutas de Expo Router (máximo 180 líneas por pantalla)
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Navegación inferior con safe areas y píldora activa
│   │   ├── index.tsx         # Dashboard de Monitoreo & Cockpit FinTech
│   │   ├── limits.tsx        # Control de Presupuesto y Límites de Sobrecarga
│   │   └── settings.tsx      # Ajustes de Hardware ESP32 y Tarifas en Bolivia
│   └── _layout.tsx           # Layout raíz con configuración de StatusBar
├── assets/                   # Logotipo oficial AhorraTech, iconos y muestra de medidor
├── src/
│   ├── components/
│   │   ├── brand/            # Logotipo oficial AhorraTech
│   │   ├── charts/           # Gráficos de potencia y barras semanales
│   │   ├── dashboard/        # BudgetCockpit, TelemetryGrid, AnalyticsDeck
│   │   ├── layout/           # ScreenWrapper y Header industrial
│   │   ├── scanner/          # Modal HUD de escaneo y calibración OCR
│   │   └── ui/               # Botones, Cards, Inputs, Badges
│   ├── hooks/                # Hooks de telemetría y notificaciones locales
│   ├── store/                # Zustand store con arquitectura atómica a 60 FPS
│   ├── styles/               # Hojas de estilo desacopladas y modulares
│   ├── theme/                # Paleta de diseño Smart Grid FinTech
│   ├── types/                # Interfaces TypeScript estrictas
│   └── utils/                # Cálculos tarifarios de Bolivia y formateadores
```

---

## 📄 Licencia

Proyecto desarrollado para la materia de Taller de Grado / Gerencia Tecnológica. Todos los derechos reservados.
