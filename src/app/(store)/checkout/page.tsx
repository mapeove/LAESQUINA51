'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/features/cart/cart-context';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { Banknote, Wallet, ArrowLeft, ShieldCheck, UserCircle, Tag } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { DeliveryZone } from '@/types';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [storeClosed, setStoreClosed] = useState(false);
  const [error, setError] = useState('');
  
  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount_amount: number} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanCode })
      });
      const data = await res.json().catch(() => null);
        
      if (!res.ok || !data?.valid) {
        setCouponError(data?.error || 'Cupón inválido, expirado o ya utilizado.');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({ code: data.code || cleanCode, discount_amount: Number(data.discount_amount) });
        setCouponInput('');
      }
    } catch {
      setCouponError('Error al validar el cupón.');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const [bizumPhone, setBizumPhone] = useState('34604267241');
  const [userId, setUserId] = useState<string | null>(null);
  
  // Delivery Zones Configured in Admin
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_address: '',
    delivery_postal_code: '41007',
    zone_id: '',
    delivery_zone: 'Polígono San Pablo / 41007',
    delivery_floor: '',
    delivery_door: '',
    notes: '',
    payment_method: 'CASH' as 'CASH' | 'BIZUM',
    cash_change_for: '',
  });

  useEffect(() => {
    let ignore = false;
    
    async function initCheckout() {
      // 1. Check Auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Redirigir si no hay sesión (checkout obligatorio con usuario autenticado)
        router.push('/login');
        return;
      }
      
      if (!ignore) {
        setUserId(session.user.id);
        
        // 2. Load Profile Data for Prefill
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          setFormData(prev => ({
            ...prev,
            customer_name: profile.full_name || '',
            customer_phone: profile.phone || '',
            customer_email: session.user.email || '',
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            customer_email: session.user.email || '',
          }));
        }

        // 3. Load Store Open & Bizum Phone
        const { data: settingsData } = await supabase
          .from('store_settings')
          .select('key, value')
          .eq('key', 'bizum_phone');

        if (settingsData) {
          const bizumSetting = settingsData.find(s => s.key === 'bizum_phone');
          if (bizumSetting?.value) setBizumPhone(bizumSetting.value);
        }
        
        // Use API for definitive status
        const statusRes = await fetch('/api/store-status');
        if (statusRes.ok) {
          const status = await statusRes.json();
          if (!status.isOpen) {
            setStoreClosed(true);
          }
        }
        
        // 4. Load Delivery Zones
        const { data: zones } = await supabase
          .from('delivery_zones')
          .select('*')
          .eq('active', true)
          .order('name');
          
        if (zones && zones.length > 0) {
          setDeliveryZones(zones);
          setSelectedZone(zones[0]);
          setFormData(prev => ({
            ...prev,
            zone_id: zones[0].id,
            delivery_zone: zones[0].name
          }));
        }

        setCheckingAuth(false);
      }
    }
    
    void initCheckout();
    
    return () => {
      ignore = true;
    };
  }, [supabase, router]);

  if (checkingAuth) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold uppercase mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
          VERIFICANDO ACCESO...
        </h1>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-16 max-w-lg mx-auto text-center animate-fade-up min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold uppercase mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
          TU CARRITO ESTÁ VACÍO
        </h1>
        <p className="text-xs mb-6 font-mono" style={{ color: '#65513F' }}>
          Añade tus hamburguesas y combos favoritos antes de realizar el pedido.
        </p>
        <Link
          href="/menu"
          className="inline-block px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md"
          style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
        >
          IR AL MENÚ
        </Link>
      </div>
    );
  }

  // Calculate delivery fee
  const DELIVERY_FEE = selectedZone?.delivery_fee ? Number(selectedZone.delivery_fee) : 0;
  const total = Math.max(0, subtotal + DELIVERY_FEE - (appliedCoupon?.discount_amount || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.customer_name || !formData.customer_phone || !formData.delivery_address) {
      setError('Por favor, completa todos los campos requeridos (*)');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        user_id: userId,
        items,
        subtotal,
        coupon_code: appliedCoupon?.code,
        delivery_fee: DELIVERY_FEE,
        total,
        cash_change_for: formData.payment_method === 'CASH' && formData.cash_change_for ? parseFloat(formData.cash_change_for) : null,
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el pedido');
      }

      clearCart();
      router.push(`/mi-cuenta`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ha ocurrido un error inesperado';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto animate-fade-up min-h-screen" style={{ backgroundColor: '#F3E8CC' }}>
      <div className="flex items-center justify-between mb-6">
        <Link href="/cart" className="flex items-center text-xs font-bold gap-1 hover:underline" style={{ color: '#65513F' }}>
          <ArrowLeft size={16} /> Volver al carrito
        </Link>
        <span className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: '#A94F2F' }}>Paso Final</span>
      </div>

      <h1
        className="text-4xl font-bold tracking-wide mb-6 text-center uppercase"
        style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}
      >
        FINALIZAR PEDIDO
      </h1>
      
      <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-3">
        <UserCircle className="w-6 h-6 text-orange-800" />
        <span className="text-sm font-bold font-mono text-orange-900">
          Hola {formData.customer_name.split(' ')[0]}, verifica tus datos para el envío.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Sección 1: Datos Personales */}
        <section className="p-6 rounded-2xl border space-y-4 shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418', borderColor: '#E8D5A8' }}>
            1. Tus Datos de Contacto
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Nombre y Apellidos *</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="w-full p-3 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Teléfono Móvil (WhatsApp) *</label>
                <input
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="612345678"
                  className="w-full p-3 rounded-xl font-mono text-sm focus:outline-none"
                  style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Email (Opcional)</label>
                <input
                  type="email"
                  disabled
                  value={formData.customer_email}
                  placeholder="juan@ejemplo.com"
                  className="w-full p-3 rounded-xl text-sm focus:outline-none opacity-60"
                  style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sección 2: Dirección */}
        <section className="p-6 rounded-2xl border space-y-4 shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418', borderColor: '#E8D5A8' }}>
            2. Dirección de Entrega en Sevilla
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Calle y Número *</label>
              <input
                type="text"
                required
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                placeholder="Ej: Calle Sinaí 14"
                className="w-full p-3 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Piso (Opcional)</label>
                <input
                  type="text"
                  value={formData.delivery_floor}
                  onChange={(e) => setFormData({ ...formData, delivery_floor: e.target.value })}
                  placeholder="Ej: 3º"
                  className="w-full p-3 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Puerta (Opcional)</label>
                <input
                  type="text"
                  value={formData.delivery_door}
                  onChange={(e) => setFormData({ ...formData, delivery_door: e.target.value })}
                  placeholder="Ej: B"
                  className="w-full p-3 rounded-xl text-sm focus:outline-none"
                  style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Código Postal *</label>
                <input
                  type="text"
                  required
                  value={formData.delivery_postal_code}
                  onChange={(e) => setFormData({ ...formData, delivery_postal_code: e.target.value })}
                  placeholder="41007"
                  className="w-full p-3 rounded-xl font-mono text-sm focus:outline-none"
                  style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Zona de Reparto *</label>
                <select
                  value={formData.zone_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const zone = deliveryZones.find(z => z.id === id);
                    if (zone) {
                      setFormData({ ...formData, zone_id: zone.id, delivery_zone: zone.name });
                      setSelectedZone(zone);
                    }
                  }}
                  className="w-full p-3 rounded-xl text-sm font-medium focus:outline-none"
                  style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
                >
                  {deliveryZones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                  {deliveryZones.length === 0 && (
                    <option value="">Cargando zonas...</option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Observaciones para el repartidor (Opcional)</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ej: Timbre averiado, llamar al llegar."
                className="w-full p-3 rounded-xl text-sm focus:outline-none"
                style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
              />
            </div>
          </div>
        </section>

        {/* Sección 3: Método de Pago (ÚNICAMENTE EFECTIVO / BIZUM) */}
        <section className="p-6 rounded-2xl border space-y-4 shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418', borderColor: '#E8D5A8' }}>
            3. Método de Pago Contra Entrega
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {/* Opción Efectivo */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, payment_method: 'CASH' })}
              className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 transition-all"
              style={
                formData.payment_method === 'CASH'
                  ? { backgroundColor: 'rgba(184,135,39,0.15)', borderColor: '#B88727', color: '#B88727' }
                  : { backgroundColor: '#F3E8CC', borderColor: '#D4C4A0', color: '#65513F' }
              }
            >
              <Banknote size={28} />
              <span className="font-bold text-xs uppercase tracking-wider font-mono">EFECTIVO</span>
              <span className="text-[10px]" style={{ color: '#65513F' }}>Pago en mano al recibir</span>
            </button>

            {/* Opción Bizum */}
            <button
              type="button"
              onClick={() => setFormData({ ...formData, payment_method: 'BIZUM' })}
              className="p-4 rounded-2xl border flex flex-col items-center justify-center text-center space-y-2 transition-all"
              style={
                formData.payment_method === 'BIZUM'
                  ? { backgroundColor: 'rgba(169,79,47,0.15)', borderColor: '#A94F2F', color: '#A94F2F' }
                  : { backgroundColor: '#F3E8CC', borderColor: '#D4C4A0', color: '#65513F' }
              }
            >
              <Wallet size={28} />
              <span className="font-bold text-xs uppercase tracking-wider font-mono">BIZUM</span>
              <span className="text-[10px]" style={{ color: '#65513F' }}>Pago por Bizum al recibir</span>
            </button>
          </div>

          {/* Detalles dinámicos según pago */}
          {formData.payment_method === 'CASH' && (
            <div className="p-4 rounded-xl border space-y-2 animate-fade-up" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
              <label className="block text-xs font-medium" style={{ color: '#3A2418' }}>
                ¿Necesitas cambio? Indica con cuánto vas a pagar (€):
              </label>
              <input
                type="number"
                step="5"
                placeholder="Ej: 20 ó 50"
                value={formData.cash_change_for}
                onChange={(e) => setFormData({ ...formData, cash_change_for: e.target.value })}
                className="w-full max-w-xs p-2.5 rounded-xl font-mono text-sm focus:outline-none"
                style={{ backgroundColor: '#FFF7E5', border: '1px solid #D4C4A0', color: '#3A2418' }}
              />
            </div>
          )}

          {formData.payment_method === 'BIZUM' && (
            <div className="p-4 rounded-xl border space-y-2 animate-fade-up" style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8' }}>
              <span className="text-xs font-bold uppercase font-mono block" style={{ color: '#A94F2F' }}>
                📱 Instrucciones de Pago por Bizum:
              </span>
              <p className="text-xs" style={{ color: '#65513F' }}>
                Realiza el Bizum al repartidor en el momento de la entrega al número oficial de La Esquina 51:
              </p>
              <div className="p-2.5 rounded-lg border font-mono text-center text-lg font-bold tracking-wider" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8', color: '#A94F2F' }}>
                {bizumPhone}
              </div>
            </div>
          )}
        </section>

        
        {/* Seccion Cupones */}
        <section className="p-6 rounded-2xl border space-y-4 shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418', borderColor: '#E8D5A8' }}>
            <Tag size={20} className="text-[#A94F2F]" /> Cupón de Descuento
          </h2>
          
          {!appliedCoupon ? (
            <div className="space-y-2">
              <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>Si tienes un cupón de descuento, colócalo aquí</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO"
                  className="flex-1 p-3 rounded-xl font-mono text-sm focus:outline-none uppercase"
                  style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="px-4 rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                  style={{ backgroundColor: '#3A2418', color: '#FFF7E5' }}
                >
                  {validatingCoupon ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponError && <p className="text-xs font-medium text-red-600 font-mono mt-1">{couponError}</p>}
            </div>
          ) : (
            <div className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: '#E3F2E1', border: '1px dashed #4CAF50' }}>
              <div>
                <p className="text-sm font-bold text-green-800">¡Cupón Aplicado!</p>
                <p className="text-xs font-mono text-green-700">{appliedCoupon.code} (-{formatPrice(appliedCoupon.discount_amount)})</p>
              </div>
              <button 
                type="button"
                onClick={() => setAppliedCoupon(null)}
                className="text-xs font-bold text-red-600 uppercase hover:underline"
              >
                Quitar
              </button>
            </div>
          )}
        </section>

        {/* Resumen del Pedido */}
        <section className="p-6 rounded-2xl border space-y-4 shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <h2 className="text-lg font-bold uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>Resumen Final</h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between" style={{ color: '#65513F' }}>
              <span>Subtotal ({items.length} líneas):</span>
              <span className="font-mono font-bold" style={{ color: '#3A2418' }}>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between" style={{ color: '#65513F' }}>
              <span>Gastos de envío:</span>
              <span className="font-mono font-bold" style={{ color: '#3A2418' }}>{formatPrice(DELIVERY_FEE)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center text-base font-bold" style={{ borderColor: '#E8D5A8', color: '#3A2418' }}>
              <span>TOTAL A PAGAR:</span>
              <span className="text-3xl font-mono font-bold" style={{ color: '#A94F2F' }}>
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </section>

        {error && <p className="text-xs font-medium text-center font-mono" style={{ color: '#A94F2F' }}>{error}</p>}

        {storeClosed ? (
          <div className="w-full p-4 rounded-2xl border text-center space-y-2" style={{ backgroundColor: '#F3E8CC', borderColor: '#A94F2F' }}>
            <p className="font-bold uppercase tracking-wider text-sm" style={{ color: '#A94F2F' }}>El establecimiento está cerrado</p>
            <p className="text-xs" style={{ color: '#65513F' }}>En este momento no podemos aceptar nuevos pedidos. Tu carrito se ha guardado para más tarde.</p>
          </div>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold uppercase tracking-wider text-base shadow-md transition-transform active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
          >
            {loading ? 'CONFIRMANDO PEDIDO...' : 'CONFIRMAR Y REALIZAR PEDIDO'}
          </button>
        )}

        <div className="flex items-center justify-center space-x-1 text-[10px] font-mono" style={{ color: '#65513F' }}>
          <ShieldCheck size={14} />
          <span>Pago 100% seguro contra entrega sin comisiones ni tarjeta</span>
        </div>
      </form>
    </div>
  );
}
