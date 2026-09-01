// ============================================================
// LA ESQUINA 51 – App Constants
// ============================================================

export const APP_NAME = 'La Esquina 51'
export const APP_TAGLINE = 'Venezuelan Street Food'
export const APP_SLOGAN = 'Sabor de calle. Sabor de casa.'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laesquina51.es'
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '604267241'
export const BIZUM_PHONE = process.env.NEXT_PUBLIC_BIZUM_PHONE ?? '633184354'

export const ORDER_NUMBER_PREFIX = 'E51-'

export const DAYS_ES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
}

// Seed delivery zones (used only for migrations – real data lives in Supabase)
export const SEED_DELIVERY_ZONES = [
  {
    name: 'Polígono San Pablo',
    postal_codes: ['41007'],
    delivery_fee: 0,
    min_order: 0,
  },
  {
    name: 'La Macarena',
    postal_codes: ['41009', '41003'],
    delivery_fee: 0,
    min_order: 0,
  },
  {
    name: 'Centro / Casco Antiguo',
    postal_codes: ['41001', '41002', '41003', '41004'],
    delivery_fee: 0,
    min_order: 0,
  },
  {
    name: 'Hytasa',
    postal_codes: ['41010'],
    delivery_fee: 0,
    min_order: 0,
  },
  {
    name: 'El Corte Inglés / Nervión',
    postal_codes: ['41005'],
    delivery_fee: 0,
    min_order: 0,
  },
  {
    name: 'Otros alrededores Sevilla',
    postal_codes: ['41006', '41008', '41011', '41012'],
    delivery_fee: 0,
    min_order: 0,
  },
]
