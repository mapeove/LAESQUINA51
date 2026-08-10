'use client';

import { useState, FormEvent } from 'react';
import { useCart } from '@/features/cart/cart-context';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    postalCode: '',
    neighborhood: '',
    floor: '',
    door: '',
    notes: ''
  });

  if (items.length === 0) {
    if (typeof window !== 'undefined') {
      router.push('/cart');
    }
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic Spanish phone validation (9 digits starting with 6, 7, 8 or 9)
    const phoneRegex = /^[6789]\d{8}$/;
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    
    if (!phoneRegex.test(cleanPhone)) {
      setError('Por favor, introduce un número de teléfono válido.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_phone: cleanPhone,
          customer_email: formData.email,
          delivery_address: formData.address,
          delivery_postal_code: formData.postalCode,
          delivery_zone: formData.neighborhood,
          delivery_floor: formData.floor,
          delivery_door: formData.door,
          notes: formData.notes,
          items,
          subtotal,
          delivery_fee: 0,
          total: subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      clearCart();
      router.push(`/orders/${data.orderNumber}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-4xl font-bebas tracking-wide mb-8" style={{ color: 'var(--brand-black)' }}>
        FINALIZAR COMPRA
      </h1>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <h2 className="font-oswald font-bold text-xl mb-4" style={{ color: 'var(--brand-black)' }}>
            1. Tu información
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nombre completo *</label>
              <input 
                required
                type="text" 
                id="name" 
                name="name" 
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2" 
                style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">Teléfono *</label>
                <input 
                  required
                  type="tel" 
                  id="phone" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Ej: 612345678"
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2" 
                  style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email (Opcional)</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2" 
                  style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section className="bg-white p-6 rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <h2 className="font-oswald font-bold text-xl mb-4" style={{ color: 'var(--brand-black)' }}>
            2. Dirección de entrega
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium mb-1">Dirección completa *</label>
              <input 
                required
                type="text" 
                id="address" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Calle Principal 15"
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2" 
                style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium mb-1">Código postal *</label>
                <input 
                  required
                  type="text" 
                  id="postalCode" 
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  maxLength={5}
                  pattern="\d{5}"
                  placeholder="41001"
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2" 
                  style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
                />
              </div>
              <div>
                <label htmlFor="neighborhood" className="block text-sm font-medium mb-1">Barrio / Zona *</label>
                <input 
                  required
                  type="text" 
                  id="neighborhood" 
                  name="neighborhood"
                  value={formData.neighborhood}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2" 
                  style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="floor" className="block text-sm font-medium mb-1">Piso (Opcional)</label>
                <input 
                  type="text" 
                  id="floor" 
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2" 
                  style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
                />
              </div>
              <div>
                <label htmlFor="door" className="block text-sm font-medium mb-1">Puerta (Opcional)</label>
                <input 
                  type="text" 
                  id="door" 
                  name="door"
                  value={formData.door}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2" 
                  style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
                />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium mb-1">Observaciones para el repartidor (Opcional)</label>
              <textarea 
                id="notes" 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Ej: El timbre no funciona, llamad al llegar."
                className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 resize-none" 
                style={{ borderColor: 'rgba(0,0,0,0.1)', outlineColor: 'var(--brand-yellow)' }}
              />
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="bg-white p-6 rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <h2 className="font-oswald font-bold text-xl mb-4" style={{ color: 'var(--brand-black)' }}>
            3. Pago
          </h2>
          <div className="p-4 rounded-xl border-2 cursor-pointer flex items-center justify-between" style={{ borderColor: 'var(--brand-yellow)', backgroundColor: 'var(--brand-cream)' }}>
            <div>
              <div className="font-bold">Pago contra entrega (Efectivo o Bizum)</div>
              <div className="text-sm mt-1" style={{ color: 'var(--brand-gray)' }}>Pago al repartidor al momento de la entrega</div>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-black">
              <div className="w-3 h-3 rounded-full bg-black"></div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="bg-white p-6 rounded-2xl border" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <h2 className="font-oswald font-bold text-xl mb-4" style={{ color: 'var(--brand-black)' }}>
            4. Resumen
          </h2>
          <div className="space-y-2 mb-4">
            {items.map(item => (
              <div key={item.cart_item_id} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.product_name}</span>
                <span>{formatPrice(item.product_price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-4 space-y-2" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <div className="flex justify-between">
              <span style={{ color: 'var(--brand-gray)' }}>Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: 'var(--brand-gray)' }}>Envío</span>
              <span className="font-bold text-green-600">GRATIS</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-oswald font-bold text-lg">TOTAL</span>
              <span className="font-bebas text-2xl tracking-wide">{formatPrice(subtotal)}</span>
            </div>
          </div>
        </section>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold uppercase text-center transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
          style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
        >
          {loading ? 'PROCESANDO...' : 'REALIZAR PEDIDO'}
        </button>
      </form>
    </div>
  );
}
