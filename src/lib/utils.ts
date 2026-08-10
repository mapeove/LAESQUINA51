import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ORDER_NUMBER_PREFIX } from './constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function generateOrderNumber(sequence: number): string {
  return `${ORDER_NUMBER_PREFIX}${String(sequence).padStart(6, '0')}`
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const international = cleaned.startsWith('34') ? cleaned : `34${cleaned}`
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
