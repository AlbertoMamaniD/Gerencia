# 🚀 Guía Definitiva: Cómo Hacer Correr y Compilar la APK — AhorraTech

Este manual detalla paso a paso cómo ejecutar la aplicación en desarrollo (en tu celular con **Expo Go**), cómo conectarla a la nube y al hardware, y cómo compilar el archivo instalador **APK de Android** para producción o defensa de proyecto.

---

## 📋 Requisitos Previos

1. **Node.js** (versión 18, 20 o 22 recomendada).
2. **Git** instalado.
3. En tu teléfono móvil Android:
   - Descarga la aplicación **Expo Go** desde Google Play Store.
   - Asegúrate de estar conectado a la misma red Wi-Fi que tu computadora (o usa el modo túnel).

---

## ⚙️ 1. Configuración de Variables de Entorno (`.env`)

En la raíz del proyecto (`C:\GERENCIA`), el archivo `.env` ya se encuentra configurado con las credenciales activas del proyecto:

```env
EXPO_PUBLIC_GEMINI_API_KEY=tu_clave_de_google_ai_studio_aqui
EXPO_PUBLIC_SUPABASE_URL=https://tu_proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase_aqui
```

> **Nota:** La aplicación utiliza **Google Gemini 3.5 Flash** para el clasificador óptico y **Supabase** para la base de datos PostgreSQL y el almacenamiento de fotografías en el bucket `meter-photos`.

---

## 📱 2. Cómo Hacer Correr la App en tu Celular (Modo Desarrollo)

Abre una terminal PowerShell en la carpeta del proyecto (`C:\GERENCIA`) y sigue una de estas dos opciones:

### Opción A: Red Wi-Fi Local (Más rápida y recomendada)
Si tu PC y tu celular están en la misma red Wi-Fi, ejecuta este comando en PowerShell:

```powershell
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.11"; npx expo start --lan -c
```

*(Si tu IP local cambia, revisa tu IP con el comando `ipconfig` en el adaptador Wi-Fi y reemplaza el `192.168.0.11`)*.

1. Aparecerá un código QR en la consola.
2. Abre la app **Expo Go** en tu celular.
3. Toca en **"Scan QR code"** y apunta a la pantalla.
4. El paquete se descargará en tu teléfono y la app abrirá inmediatamente.

### Opción B: Modo Túnel con Ngrok (Para cualquier red o datos móviles)
Si tienes problemas con el Wi-Fi, adaptadores virtuales o estás usando datos móviles en el celular:

```powershell
npx expo start --tunnel ngrok -c
```

> **¿Por qué `-c`?** La bandera `-c` limpia la caché de Metro Bundler asegurando que cargue los cambios más recientes del archivo `.env` y las imágenes.

---

## 📦 3. Cómo Compilar y Generar el APK Independiente (Android)

El archivo instalador `.apk` permite instalar la aplicación directamente en cualquier celular Android sin depender de Expo Go ni de tener la computadora encendida.

El proyecto ya cuenta con la configuración oficial en [`eas.json`](file:///c:/GERENCIA/eas.json) con el perfil `preview` configurado para generar un archivo APK directo (`buildType: "apk"`).

### Pasos para compilar:

#### Paso 3.1: Iniciar sesión en Expo Application Services (EAS)
En la terminal ejecuta:
```powershell
npx eas-cli@latest login
```
- Si ya tienes cuenta en [expo.dev](https://expo.dev), ingresa tu usuario y contraseña.
- Si no tienes cuenta, crea una gratis en [expo.dev/signup](https://expo.dev/signup) (tarda menos de 1 minuto).

#### Paso 3.2: Vincular el proyecto en EAS (Solo se hace la primera vez)
```powershell
npx eas-cli@latest project:init
```
Presiona `Enter` para aceptar la vinculación con tu cuenta de Expo.

#### Paso 3.3: Lanzar la compilación de la APK en la nube
Ejecuta el siguiente comando:
```powershell
npx eas-cli@latest build -p android --profile preview
```

**¿Qué hace este comando?**
1. Empaqueta el código fuente y lo envía a los servidores en la nube de EAS Build.
2. Compila el código nativo de Android en máquinas dedicadas de Expo (no necesitas tener Android Studio ni gigas de SDKs instalados en tu computadora).
3. Al finalizar (tarda aproximadamente entre 5 a 10 minutos), la terminal te mostrará un **código QR y un enlace directo de descarga**.
4. Abres el enlace en el navegador de tu celular, descargas el archivo `application.apk` e instalas la app.

---

## 🗄️ 4. Base de Datos y Almacenamiento en Supabase

El backend utiliza Supabase PostgreSQL y Supabase Storage:

### Estructura disponible:
- **Bucket Storage:** `meter-photos` (Bucket público para almacenar las fotografías de las calibraciones de los medidores).
- **Tabla de Auditoría:** `public.meter_scans` (Registra la fecha, foto URL, kWh leídos por IA, kWh del hardware y diferencia).
- **Tablas de Tarifas y Telemetría:** `tariff_plans` (CRE, DELAPAZ, ELFEC), `telemetry_readings`, `daily_energy_aggregates`.

Si necesitas reiniciar o verificar el esquema SQL completo, el archivo maestro se encuentra en [`supabase/schema.sql`](file:///c:/GERENCIA/supabase/schema.sql).

---

## 🔌 5. Conexión con Hardware (ESP32 + PZEM-004T)

La aplicación cuenta con dos modos de funcionamiento que se gestionan desde la pestaña **Ajustes**:

1. **Modo Simulación:**
   - Si no tienes el circuito físico conectado, la aplicación genera fluctuaciones y consumos realistas de una vivienda en Bolivia a 220V / 50Hz.
2. **Modo Hardware Real:**
   - Conecta tu ESP32 al Wi-Fi de tu casa o al punto de acceso local.
   - El microcontrolador expone un servidor HTTP con la ruta:
     ```http
     GET http://<IP_ESP32>/api/telemetry
     ```
     Respuesta JSON:
     ```json
     {
       "voltage": 221.4,
       "current": 3.25,
       "power": 712.0,
       "energy": 84.60,
       "frequency": 50.1,
       "powerFactor": 0.98,
       "timestamp": 1729864200000
     }
     ```
   - En la pestaña **Ajustes** de la app, ingresa la IP del ESP32 (por ejemplo `192.168.0.50`) y presiona **Guardar Parámetros Técnicos**. La app comenzará a leer los datos cada 2 segundos.

---

## 📸 6. Escáner Óptico de Medidor (OCR con IA Gemini 3.5 Flash)

La pestaña **Escáner** permite fotografiar el medidor de luz de tu domicilio para sincronizar la lectura acumulada:

1. Presiona **Tomar Foto** o **Galería**.
2. **Filtro estricto anti-fraude:**
   - Si fotografías un objeto cualquiera (un pie, una media, ropa, piso o pantalla en negro), la IA **rechaza la foto de inmediato** y muestra una alerta:
     > *"No se detectó un medidor eléctrico en la imagen. Por favor enfoca el display de tu medidor de luz."*
   - No se generan números ficticios.
3. Si la foto contiene un display de medidor eléctrico real (digital o analógico de disco):
   - La IA extrae los **kWh acumulados** y el **número de serie**.
   - Muestra la tarjeta de confirmación con el cálculo de costo en Bolivianos (`Bs`).
   - Al presionar **Sincronizar y Calibrar en Nube**, sube la fotografía a Supabase Storage y calibra los acumuladores del sistema.

---

## 🛠️ 7. Solución de Problemas Frecuentes (Troubleshooting)

### Error: "Something went wrong / java.io.IOException: Failed to download remote update"
- **Causa:** Tu celular intentó conectarse a una IP virtual (como la de WSL o loopback `127.0.0.1`) en lugar de tu IP Wi-Fi física.
- **Solución:** Corre el comando forzando tu IP de red:
  ```powershell
  $env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.11"; npx expo start --lan -c
  ```

### Error: "Couldn't create a signed tunnel URL for this project"
- **Causa:** No estás autenticado en Expo para usar sus túneles propietarios.
- **Solución:** Usa el túnel con ngrok (ya incluido en el proyecto):
  ```powershell
  npx expo start --tunnel ngrok -c
  ```

### Verificación de integridad del código:
Antes de compilar o hacer cambios importantes, puedes verificar que no existan errores de tipos o dependencias con:
```powershell
npx tsc --noEmit        # Verifica TypeScript (debe dar 0 errores)
npx expo-doctor         # Verifica dependencias de Expo (20/20 checks)
```
