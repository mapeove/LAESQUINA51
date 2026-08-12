# La Esquina 51 - Android & PWA App

Esta documentación describe el flujo de desarrollo, sincronización y publicación de la aplicación web como aplicación nativa Android utilizando Capacitor, así como las directrices de la Progressive Web App (PWA).

## 1. Requisitos
- Node.js (actual)
- Android Studio (versión más reciente) con SDK Tools instaladas
- Android SDK API 36 (targetSdk 36) para compatibilidad con las exigencias de Google Play a partir de agosto de 2026.

## 2. PWA
La aplicación web es una Progressive Web App instalable (PWA) con el manifest en la carpeta `public/` o integrado en Next.js.
- **Iconos:** Asegúrate de tener los iconos `192x192` y `512x512` generados correctamente.
- **Theme Color:** Utiliza colores de marca coherentes (crema y terracota).
- **iOS:** La app no está empaquetada como IPA nativo de iOS. Los usuarios de iPhone deben usar Safari, ir a la URL de producción y seleccionar "Compartir -> Añadir a pantalla de inicio".

## 3. Capacitor Commands

### Inicialización (Ya Realizada)
El proyecto Capacitor ya está inicializado. No es necesario repetir `npx cap init` ni `npx cap add android`.

### Sincronización
Cada vez que instales un nuevo plugin de Capacitor usando `npm install` o si hubiese cambios en dependencias nativas:
```bash
npx cap sync android
```
**Nota:** Dado que usamos la estrategia `server.url` apuntando directamente a producción (`https://laesquina51.es`), **no es necesario** hacer `npm run build` y `cap sync` por cada cambio en el frontend (Next.js). Los cambios web se ven reflejados automáticamente en la aplicación al recargar la página. `cap sync` sólo es necesario para cambios en plugins o configuraciones de la plataforma en `capacitor.config.ts`.

## 4. Configuración de Capacitor
El archivo `capacitor.config.ts` utiliza la directiva:
```typescript
  server: {
    url: 'https://laesquina51.es',
    cleartext: false
  },
```
Esto incrusta la web en vivo. Las credenciales (`SUPABASE_SERVICE_ROLE_KEY`, contraseñas) viven en el entorno de Vercel y **nunca** están expuestas dentro del APK o AAB de Capacitor, haciéndolo totalmente seguro.

## 5. Development & Debug APK
Para probar la app:
1. Abre Android Studio:
```bash
npx cap open android
```
2. Ejecuta la app en un emulador o un dispositivo real (Build > Make Project & Run).
3. La APK debug se genera habitualmente en `android/app/build/outputs/apk/debug/app-debug.apk`.

## 6. Release & Google Play

Para publicar la app en Google Play Store:
Google exige el formato AAB (Android App Bundle).

### 6.1 Aumentar Version
Antes de compilar la nueva versión, actualiza:
- `android/app/build.gradle`:
  - `versionCode` (aumentar +1 por cada subida, ej. de 1 a 2)
  - `versionName` (ej. de "1.0.0" a "1.0.1")

### 6.2 Keystore
Nunca incluyas un archivo `.jks` de firmas en el repositorio (el `.gitignore` ya excluye `*.jks` y `*.keystore`).
Para generar una firma (fuera del repositorio o teniéndola excluida):
```bash
keytool -genkey -v -keystore laesquina51-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias key0
```
Mantenla segura. 

### 6.3 Construcción del AAB
En Android Studio:
1. Ve a **Build > Generate Signed Bundle / APK...**
2. Selecciona **Android App Bundle**.
3. Indica el archivo keystore (`laesquina51-release.jks`), alias, y contraseñas.
4. Finaliza el asistente.
El AAB listo para producción quedará en `android/app/release/app-release.aab`.

## 7. Comportamiento en Android (Android WebView)
- **Safe Areas**: Manejados vía CSS `env(safe-area-inset-top)` en Next.js.
- **Teclado**: Evita que los inputs oculten los botones (se comporta según las normas del WebView por defecto).
- **Notificaciones Push**: Todavía no implementadas nativamente. En un futuro, si es necesario, utilizar plugin `@capacitor/push-notifications` e integrarlo.
- **Autenticación (Supabase)**: El WebView maneja cookies de sesión como un navegador normal. Cierres de app mantienen la sesión intacta.
- **Sonidos**: Los sonidos de alerta (como pedidos entrantes de Admin) funcionan dentro de la app sin requerir ventanas flotantes nativas.

## 8. Splash Screen & Iconos (Res/Mipmap)
Reemplaza los iconos genéricos por los de la marca en `android/app/src/main/res/`.
- Iconos: `mipmap-*`
- El fondo y el diseño base del splash están configurados en `android/app/src/main/res/values/styles.xml` (Color "splashBackground").
