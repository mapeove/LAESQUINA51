import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/administrador',
        '/administrador/*',
        '/mi-cuenta',
        '/mi-cuenta/*',
        '/checkout',
        '/login',
        '/registro',
        '/api',
        '/api/*',
        '/cart',
        '/orders',
        '/orders/*',
        '/repartidor',
        '/repartidor/*'
      ],
    },
    sitemap: 'https://www.laesquina51.es/sitemap.xml',
  };
}
