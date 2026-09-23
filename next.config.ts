import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// Extraer el host de la URL de Supabase para restringir las imágenes remotas
let supabaseHostname = ''
try {
  supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : ''
} catch {
  // URL inválida: no se permite ningún origen remoto
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            port: '',
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // 'unsafe-inline' es requerido por Next.js App Router: React streaming emite
              // <script> inline para reemplazar loading.tsx por el contenido real ($RC) y
              // para el flight data de hidratacion (self.__next_f.push). Sin este token,
              // el navegador bloquea esos scripts por CSP y la pagina queda en loading
              // infinito aunque el HTML llegue completo.
              `script-src 'self' 'unsafe-inline' ${supabaseUrl}`,
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: ${supabaseUrl}`,
              `connect-src 'self' ${supabaseUrl}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/profile',
        destination: '/mi-cuenta',
        permanent: true,
      },
      {
        source: '/orders',
        destination: '/mi-cuenta',
        permanent: true,
      },
    ]
  },
}

export default nextConfig