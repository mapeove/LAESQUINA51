import { createClient } from '@/lib/supabase/server';
import { formatPrice } from '@/lib/utils';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle, Clock } from 'lucide-react';

export default async function OrderConfirmationPage({ 
  params 
}: { 
  params: Promise<{ orderNumber: string }> 
}) {
  const { orderNumber } = await params;
  
  // Try to fetch real order data if supabase is configured
  // For now, handling the dev fallback if fetch fails or no env vars
  let order = null;

  try {
    const supabase = await createClient();
    
    // Fetch order from DB
    const { data: orderData, error: dbError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('order_number', orderNumber)
      .single();

    if (dbError) throw dbError;
    order = orderData;
  } catch {
    // If not found and order number is valid format, show mock in dev mode
    if (orderNumber.startsWith('E51-') && process.env.NODE_ENV === 'development') {
      order = {
        order_number: orderNumber,
        status: 'pending',
        created_at: new Date().toISOString(),
        customer_name: 'Cliente Demo',
        customer_phone: '612345678',
        shipping_address: 'Calle Demo 1, 41001 Sevilla',
        total: 15.50,
        order_items: [
          { name: 'Tequeños', quantity: 1, price: 6.50 },
          { name: 'Arepa Pelúa', quantity: 1, price: 9.00 }
        ]
      };
    } else {
      notFound();
    }
  }

  if (!order) {
    notFound();
  }

  const message = `Hola, acabo de realizar el pedido ${orderNumber}`;
  const whatsappUrl = `https://wa.me/34${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
      <div className="bg-white p-8 rounded-3xl border shadow-sm mb-8" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-oswald font-bold mb-2" style={{ color: 'var(--brand-black)' }}>
          ¡Pedido Confirmado!
        </h1>
        <p className="mb-6 text-lg" style={{ color: 'var(--brand-gray)' }}>
          Tu pedido ha sido recibido y está siendo procesado.
        </p>

        <div className="py-6 px-4 rounded-xl mb-8" style={{ backgroundColor: 'var(--brand-cream)' }}>
          <div className="text-sm mb-1 uppercase tracking-wider" style={{ color: 'var(--brand-gray)' }}>Número de Pedido</div>
          <div className="text-5xl font-bebas tracking-wide" style={{ color: 'var(--brand-yellow)', textShadow: '1px 1px 0 #000' }}>
            {order.order_number}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4 text-left">
          <div className="flex-1 p-4 border rounded-xl" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <h3 className="font-bold mb-2">Detalles del cliente</h3>
            <p className="text-sm text-gray-600">{order.customer_name}</p>
            <p className="text-sm text-gray-600">{order.customer_phone}</p>
            <p className="text-sm text-gray-600 mt-2">{order.shipping_address}</p>
          </div>
          
          <div className="flex-1 p-4 border rounded-xl" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Estado
            </h3>
            <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              Pendiente
            </div>
            <p className="text-sm text-gray-600 mt-4">
              <strong>Total:</strong> {formatPrice(order.total)}
            </p>
          </div>
        </div>
      </div>

      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-full sm:w-auto px-8 py-4 rounded-xl font-bold uppercase transition-transform hover:scale-105 mb-4 text-white"
        style={{ backgroundColor: '#25D366' }} // WhatsApp color
      >
        CONTACTAR POR WHATSAPP
      </a>
      
      <div className="mt-4">
        <Link 
          href="/"
          className="font-medium underline underline-offset-4"
          style={{ color: 'var(--brand-gray)' }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
