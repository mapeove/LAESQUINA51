# La Esquina 51 🍔🇻🇪

¡Bienvenido al repositorio oficial de **La Esquina 51**! Esta es la aplicación web e híbrida nativa para la gestión de pedidos de comida venezolana a domicilio y recogida en Sevilla. Disfruta de nuestras hamburguesas virales, perros calientes, empanadas, boxes y más, de manera directa e instalable en tu dispositivo.

---

## 🛠️ Tecnologías Utilizadas

La aplicación está construida sobre un stack moderno, seguro y optimizado para el máximo rendimiento tanto en web como en dispositivos móviles:

- **Frontend / Fullstack:** [Next.js 16 (16.3.0)](https://nextjs.org/) con soporte de React 19, utilizando el App Router para layouts persistentes, rutas dinámicas e incrementales y optimizaciones avanzadas de imágenes y SEO.
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) para una maquetación ágil, moderna y totalmente adaptada a dispositivos móviles (Mobile-First).
- **Backend / Base de Datos:** [Supabase](https://supabase.com/) como Backend-as-a-Service para autenticación de usuarios, base de datos en tiempo real (PostgreSQL), almacenamiento de imágenes de productos y funciones de servidor seguras.
- **Contenedor Nativo Móvil:** [Capacitor](https://capacitorjs.com/) para empaquetar la aplicación web como una aplicación nativa de Android, permitiendo interacciones con el hardware y notificaciones push.
- **PWA (Progressive Web App):** Configurada para ser instalable directamente en dispositivos móviles de forma ligera con soporte offline parcial, manifiesto web y optimización de rendimiento.

---

## 🔑 Variables de Entorno Requeridas

Crea un archivo `.env.local` en la raíz de la carpeta `la-esquina-51/` copiando el contenido de `.env.example`. Las variables necesarias son:

### Conexión a Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: URL pública de tu instancia de Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima pública de Supabase para interacciones seguras del lado del cliente.
- `SUPABASE_SERVICE_ROLE_KEY`: Clave de rol de servicio (**SOLO servidor**). Nunca la expongas en el cliente ni la subas al repositorio, ya que permite saltarse las políticas de seguridad (RLS).

### Configuración de la App
- `NEXT_PUBLIC_APP_URL`: URL base de la aplicación en producción (ej. `https://www.laesquina51.es`).
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: Número de teléfono de contacto para notificaciones y soporte por WhatsApp (ej. `34633184354`).

### Configuración del Administrador Inicial
- `ADMIN_EMAIL`: Correo electrónico por defecto para el administrador inicial del sistema.
- `ADMIN_PASSWORD`: Contraseña segura para el administrador inicial.

### Servidor de Correo SMTP (Notificaciones de Pedidos / Recuperación)
- `SMTP_HOST`: Servidor SMTP para envío de correos (ej. `smtp.serviciodecorreo.es`).
- `SMTP_PORT`: Puerto de conexión SMTP (ej. `465`).
- `SMTP_SECURE`: `true` si usas SSL/TLS (Puerto 465) o `false` para conexiones no seguras.
- `SMTP_USER`: Nombre de usuario del remitente del sistema de correos.
- `SMTP_PASS`: Contraseña de autenticación de tu correo SMTP.
- `SMTP_FROM`: Identidad del remitente (ej. `"La Esquina 51" <no-reply@laesquina51.es>`).

---

## 💻 Comandos de Desarrollo y Construcción (Build)

Ejecuta todos los comandos desde el directorio principal del proyecto (`la-esquina-51/`).

### 1. Entorno de Desarrollo Web
Instala las dependencias necesarias e inicia el servidor de desarrollo local:
```bash
# Instalar dependencias
npm install

# Iniciar servidor local
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver y desarrollar la aplicación de forma interactiva con recarga rápida (HMR).

### 2. Construcción (Build) de la Web
Genera la versión optimizada de producción de Next.js:
```bash
npm run build
```
La compilación se guardará en la carpeta `.next/`.

### 3. Comandos de Capacitor (Android)
El proyecto utiliza un enfoque híbrido en vivo para el contenedor de Android (`capacitor.config.ts`), apuntando directamente al dominio de producción (`https://www.laesquina51.es`). Esto agiliza las actualizaciones ya que los cambios en la web se reflejan de inmediato en la app nativa sin necesidad de reinstalar o recompilar el APK.

#### Sincronización de Plugins e Interfaz Nativa
Ejecútalo si añades o eliminas dependencias nativas o plugins de Capacitor:
```bash
npx cap sync android
```

#### Abrir en Android Studio
Abre el proyecto nativo en Android Studio para depurar, probar en emuladores o generar el APK/AAB definitivo:
```bash
npx cap open android
```

#### Compilación de Debug e Instalación en Dispositivo
1. Abre el proyecto en Android Studio con `npx cap open android`.
2. Conecta tu móvil Android con la depuración USB habilitada o inicia un emulador.
3. Haz clic en **Run** (índice verde) para instalar la app. El APK de depuración se generará en:
   `android/app/build/outputs/apk/debug/app-debug.apk`

#### Compilación para Producción (Google Play)
Google Play Store exige las aplicaciones en formato **AAB (Android App Bundle)**:
1. Incrementa el `versionCode` y actualiza el `versionName` en `android/app/build.gradle`.
2. En Android Studio, selecciona **Build > Generate Signed Bundle / APK...**
3. Selecciona **Android App Bundle** y fírmalo con tu archivo Keystore (`laesquina51-release.jks`).
4. El archivo AAB optimizado estará disponible en:
   `android/app/release/app-release.aab`

---

## 📁 Estructura del Proyecto

```text
la-esquina-51/
├── android/                     # Directorio del proyecto nativo Android
├── public/                      # Recursos públicos (imágenes, manifiesto, iconos)
├── src/
│   ├── app/                     # Enrutador App Router de Next.js
│   │   ├── (store)/             # Páginas y vistas de la tienda pública
│   │   ├── administrador/       # Panel de control de administración
│   │   ├── repartidor/          # Panel de control de los repartidores
│   │   ├── api/                 # Endpoints de API internas y Webhooks
│   │   ├── loading.tsx          # Pantalla de carga global (Spinner de la marca)
│   │   └── error.tsx            # Captura de errores global de Next.js
│   ├── components/              # Componentes de UI compartidos
│   ├── features/                # Lógica de negocio (carrito, pedidos, productos...)
│   └── lib/                     # Utilidades, servicios (Supabase, clientes SMTP)
├── capacitor.config.ts          # Configuración del puente nativo Capacitor
└── package.json                 # Dependencias y scripts de ejecución
```

---

## 🚀 Despliegue en Producción (Vercel)

El frontend de Next.js se despliega de manera continua en [Vercel](https://vercel.com). Cada fusión a la rama principal compila y publica de manera automática la última versión optimizada del sitio.

Asegúrate de configurar las variables de entorno detalladas arriba en el panel de control de tu proyecto en Vercel para garantizar el perfecto funcionamiento de Supabase, el envío de correos y la pasarela del negocio.
