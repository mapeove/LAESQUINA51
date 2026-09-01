// ============================================================
// LA ESQUINA 51 – App Constants
// ============================================================

export const APP_NAME = 'La Esquina 51'
export const APP_TAGLINE = 'Sabor Venezolano en Sevilla'
export const APP_SLOGAN = 'Sabor de calle. Sabor de casa.'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laesquina51.es'
export const WHATSAPP_NUMBER = '604267241'
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
    name: 'El Corte Inglés Nervión',
    postal_codes: ['41005'],
    delivery_fee: 0,
    min_order: 0,
  },
  {
    name: 'Otros alrededores',
    postal_codes: ['41006', '41008', '41011', '41012'],
    delivery_fee: 0,
    min_order: 0,
  },
]

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparación',
  ON_THE_WAY: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-amber-100', text: 'text-amber-800' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800' },
  PREPARING: { bg: 'bg-orange-100', text: 'text-orange-800' },
  ON_THE_WAY: { bg: 'bg-purple-100', text: 'text-purple-800' },
  DELIVERED: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-800' },
}
