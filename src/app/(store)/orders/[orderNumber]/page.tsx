import { createClient } from '@/lib/supabase/server';
import { formatPrice, getWhatsAppUrl } from '@/lib/utils';
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
    if (orderNumber.startsWith('E51-') && process.env.NODE_ENV === 'development') {
      order = {
        order_number: orderNumber,
        status: 'pending',
        created_at: new Date().toISOString(),
        customer_name: 'Cliente Demo',
        customer_phone: '612345678',
        delivery_address: 'Calle Demo 1, 41007 Sevilla',
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
  const whatsappUrl = getWhatsAppUrl(WHATSAPP_NUMBER, message);

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl text-center min-h-screen" style={{ backgroundColor: '#F3E8CC' }}>
      <div className="p-8 rounded-3xl border shadow-sm mb-8" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-bold uppercase mb-2" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
          ¡Pedido Confirmado!
        </h1>
        <p className="mb-6 text-sm font-mono" style={{ color: '#65513F' }}>
          Tu pedido ha sido recibido y está siendo procesado por La Esquina 51.
        </p>

        <div className="py-6 px-4 rounded-2xl mb-8 border" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
          <div className="text-xs font-mono font-bold uppercase tracking-wider mb-1" style={{ color: '#65513F' }}>Número de Pedido</div>
          <div className="text-5xl font-bold font-mono tracking-wide" style={{ color: '#A94F2F' }}>
            {order.order_number}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4 text-left">
          <div className="flex-1 p-4 border rounded-xl" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
            <h3 className="font-bold mb-2 uppercase text-xs tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>Detalles del cliente</h3>
            <p className="text-sm font-semibold" style={{ color: '#3A2418' }}>{order.customer_name}</p>
            <p className="text-xs font-mono" style={{ color: '#65513F' }}>{order.customer_phone}</p>
            <p className="text-xs mt-2" style={{ color: '#65513F' }}>{order.delivery_address || order.shipping_address}</p>
          </div>
          
          <div className="flex-1 p-4 border rounded-xl" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
            <h3 className="font-bold mb-2 uppercase text-xs tracking-wider flex items-center gap-2" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
              <Clock className="w-4 h-4" /> Estado
            </h3>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono" style={{ backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
              Pendiente
            </div>
            <p className="text-sm font-mono mt-4" style={{ color: '#3A2418' }}>
              <strong>Total:</strong> {formatPrice(order.total)}
            </p>
          </div>
        </div>
      </div>

      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block w-full sm:w-auto px-8 py-4 rounded-2xl font-bold uppercase tracking-wider transition-transform hover:scale-105 mb-4 text-white shadow-md text-sm font-mono"
        style={{ backgroundColor: '#25D366' }}
      >
        CONTACTAR POR WHATSAPP
      </a>
      
      <div className="mt-4">
        <Link 
          href="/"
          className="font-mono text-xs font-bold underline"
          style={{ color: '#65513F' }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
