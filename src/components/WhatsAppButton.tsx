'use client';

import React from 'react';
import { getWhatsAppUrl } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const url = getWhatsAppUrl('34604267241', '¡Hola! 🍔 Me gustaría hacer un pedido.');

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-transform hover:scale-110 md:bottom-6 md:right-6"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
