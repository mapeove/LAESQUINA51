'use client';

import { useState } from 'react';
import { Package, MapPin, X, AlertCircle } from 'lucide-react';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import type { Order } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useCart } from '@/features/cart/cart-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItemSnapshot {
  product_id: string;
  quantity: number;
  product_name_snapshot?: string;
  product_name?: string;
  item_total?: number;
  line_total?: number;
  options_snapshot?: {
    group_id?: string;
    group_name?: string;
    id?: string;
    name?: string;
  }[];
  extras_snapshot?: {
    id?: string;
    name?: string;
  }[];
}

export default function OrderHistoryClient({ pastOrders }: { pastOrders: Order[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRepeating, setIsRepeating] = useState(false);
  const { addItem, clearCart } = useCart();
  const router = useRouter();
  const supabase = createClient();

  const handleRepeatOrder = async (order: Order) => {
    setIsRepeating(true);
    try {
      const productIds = order.items?.map(i => i.product_id).filter(Boolean) || [];
      if (productIds.length === 0) {
        alert('Este pedido no tiene productos válidos para repetir.');
        setIsRepeating(false);
        return;
      }

      // Fetch current products with options and extras
      const { data: currentProducts, error } = await supabase
        .from('products')
        .select(`
          *,
          option_groups:product_option_groups(*, options:product_options(*)),
          extras:product_extras(*)
        `)
        .in('id', productIds)
        .eq('active', true)
        .eq('sold_out', false);

      if (error) throw error;

      let missingProducts = false;
      const validCartItems = [];

      for (const rawItem of order.items || []) {
        const item = rawItem as unknown as OrderItemSnapshot; // Cast to access snapshot fields
        const currentProduct = currentProducts?.find(p => p.id === item.product_id);
        
        if (!currentProduct) {
          missingProducts = true;
          continue;
        }

        // Map options
        const mappedOptions = [];
        if (item.options_snapshot && Array.isArray(item.options_snapshot)) {
          for (const optSnap of item.options_snapshot) {
            const currentGroup = currentProduct.option_groups?.find((g: { id: string; name: string }) => g.id === optSnap.group_id || g.name === optSnap.group_name);
            const currentOpt = currentGroup?.options?.find((o: { id: string; name: string; price_modifier: number }) => o.id === optSnap.id || o.name === optSnap.name);
            if (currentOpt && currentGroup) {
              mappedOptions.push({
                group_id: currentGroup.id,
                group_name: currentGroup.name,
                option_id: currentOpt.id,
                option_name: currentOpt.name,
                price_modifier: currentOpt.price_modifier
              });
            }
          }
        }

        // Map extras
        const mappedExtras = [];
        if (item.extras_snapshot && Array.isArray(item.extras_snapshot)) {
          for (const extSnap of item.extras_snapshot) {
            const currentExt = currentProduct.extras?.find((e: { id: string; name: string; active: boolean; price: number }) => (e.id === extSnap.id || e.name === extSnap.name) && e.active);
            if (currentExt) {
              mappedExtras.push({
                extra_id: currentExt.id,
                extra_name: currentExt.name,
                price: currentExt.price
              });
            }
          }
        }

        const unitPrice = currentProduct.price + 
          mappedOptions.reduce((sum, o) => sum + o.price_modifier, 0) + 
          mappedExtras.reduce((sum, e) => sum + e.price, 0);

        validCartItems.push({
          product_id: currentProduct.id,
          product_name: currentProduct.name,
          product_price: currentProduct.price,
          product_image: currentProduct.image || null,
          quantity: item.quantity,
          selected_options: mappedOptions,
          selected_extras: mappedExtras,
          line_total: unitPrice * item.quantity
        });
      }

      if (validCartItems.length === 0) {
        alert('Ninguno de los productos de este pedido está disponible actualmente.');
        setIsRepeating(false);
        return;
      }

      if (missingProducts) {
        const proceed = window.confirm('Uno o varios productos de este pedido ya no están disponibles. ¿Añadir solo los disponibles al carrito?');
        if (!proceed) {
          setIsRepeating(false);
          return;
        }
      }

      const { data: settings } = await supabase.from('store_settings').select('value').eq('key', 'store_open').single();
      if (settings && settings.value === 'false') {
        alert('Ahora mismo estamos cerrados. Podrás realizar tu pedido cuando volvamos a abrir.');
        setIsRepeating(false);
        return;
      }

      // Add to cart
      clearCart();
      validCartItems.forEach(item => addItem(item));
      
      router.push('/checkout');
    } catch (e) {
      console.error(e);
      alert('Error al procesar la repetición del pedido.');
    } finally {
      setIsRepeating(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="font-bold text-2xl uppercase mb-4" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
        Historial de Pedidos
      </h2>
      
      {pastOrders.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: '#E8D5A8' }} />
          <p className="text-sm font-bold uppercase" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>Aún no tienes pedidos pasados.</p>
          <Link href="/menu" className="mt-4 inline-block px-6 py-2 rounded font-bold text-xs uppercase transition-transform hover:scale-105" style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}>
            Ver Menú
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pastOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="p-4 rounded-xl border flex flex-col gap-2 cursor-pointer transition-transform hover:-translate-y-1" 
              style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold font-mono" style={{ color: '#65513F' }}>#{order.order_number}</span>
                  <p className="text-sm font-bold" style={{ color: '#3A2418' }}>
                    {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS]}`}>
                  {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                </span>
              </div>
              <div className="flex justify-between items-end mt-2">
                <div className="flex items-center gap-1 text-xs" style={{ color: '#65513F' }}>
                  <MapPin className="w-3 h-3" /> {order.delivery_address}
                </div>
                <span className="font-bold text-lg" style={{ color: '#3A2418' }}>€{Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
          <div 
            className="bg-white w-full sm:w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom"
            style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top))' }}
          >
            <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b rounded-t-3xl sm:rounded-t-3xl" style={{ borderColor: '#E8D5A8' }}>
              <div>
                <h3 className="font-bold text-lg uppercase" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>Detalle del pedido</h3>
                <span className="text-xs font-mono" style={{ color: '#65513F' }}>#{selectedOrder.order_number}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-5 pb-[env(safe-area-inset-bottom)]">
              <div className="flex justify-between items-center mb-6">
                <p className="text-sm font-bold" style={{ color: '#3A2418' }}>
                  {new Date(selectedOrder.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${ORDER_STATUS_COLORS[selectedOrder.status as keyof typeof ORDER_STATUS_COLORS]}`}>
                  {ORDER_STATUS_LABELS[selectedOrder.status as keyof typeof ORDER_STATUS_LABELS]}
                </span>
              </div>

              <div className="space-y-4 mb-6">
                {selectedOrder.items?.map((rawItem, idx: number) => {
                  const item = rawItem as unknown as OrderItemSnapshot;
                  return (
                  <div key={idx} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-2">
                        <span className="font-black text-[#A94F2F]">{item.quantity}x</span>
                        <div>
                          <p className="font-bold text-sm text-[#3A2418] leading-tight">{item.product_name_snapshot || item.product_name}</p>
                          {(item.options_snapshot || []).map((opt, oidx: number) => (
                            <p key={oidx} className="text-[10px] text-[#65513F] leading-tight mt-1">• {opt.name}</p>
                          ))}
                          {(item.extras_snapshot || []).map((ext, eidx: number) => (
                            <p key={eidx} className="text-[10px] text-[#A94F2F] leading-tight mt-1">+ {ext.name}</p>
                          ))}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#3A2418]">€{Number(item.item_total || item.line_total).toFixed(2)}</span>
                    </div>
                  </div>
                )})}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm mb-6" style={{ borderColor: '#E8D5A8' }}>
                <div className="flex justify-between text-[#65513F]">
                  <span>Subtotal</span>
                  <span className="font-mono text-[#3A2418]">€{Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#65513F]">
                  <span>Envío</span>
                  <span className="font-mono text-[#3A2418]">€{Number(selectedOrder.delivery_fee).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 font-bold text-lg border-t border-dashed" style={{ borderColor: '#D4C4A0' }}>
                  <span className="uppercase text-[#3A2418]">Total</span>
                  <span className="font-mono text-[#A94F2F]">€{Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-[#FFF7E5] p-4 rounded-xl border space-y-3" style={{ borderColor: '#E8D5A8' }}>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#A94F2F]">Método de pago</span>
                  <span className="text-sm font-bold text-[#3A2418] font-mono">{selectedOrder.payment_method}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#A94F2F]">Dirección del pedido anterior</span>
                  <span className="text-sm font-medium text-[#3A2418]">{selectedOrder.delivery_address} {selectedOrder.delivery_floor} {selectedOrder.delivery_door}</span>
                  <span className="block text-xs mt-1 text-[#65513F]">{selectedOrder.delivery_zone_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-[#A94F2F]">Teléfono asociado</span>
                  <span className="text-sm font-mono text-[#3A2418]">{selectedOrder.customer_phone}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-white sm:rounded-b-3xl mb-[env(safe-area-inset-bottom)]" style={{ borderColor: '#E8D5A8' }}>
              <button 
                onClick={() => handleRepeatOrder(selectedOrder)}
                disabled={isRepeating}
                className="w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wide transition-colors flex justify-center items-center gap-2"
                style={{ backgroundColor: '#A94F2F', color: 'white' }}
              >
                {isRepeating ? 'Verificando productos...' : 'Repetir Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
