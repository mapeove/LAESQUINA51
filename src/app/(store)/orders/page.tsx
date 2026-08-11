'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Package, Clock, CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type OrderSummary = {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
};

export default function OrdersSearchPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim() || !phone.trim()) return;

    setLoading(true);
    setSearched(true);
    setError('');

    try {
      const cleanPhone = phone.replace(/\s+/g, '');
      const cleanOrderNum = orderNumber.trim();
      const response = await fetch(
        `/api/orders/search?orderNumber=${encodeURIComponent(cleanOrderNum)}&phone=${encodeURIComponent(cleanPhone)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar el pedido');
      }

      setOrders(data.orders || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
      case 'ENTREGADO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" /> Entregado
          </span>
        );
      case 'PREPARING':
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-800">
            <Package className="w-3 h-3" /> En proceso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono" style={{ backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
            <Clock className="w-3 h-3" /> Pendiente
          </span>
        );
    }
  };

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto animate-fade-up min-h-screen" style={{ backgroundColor: '#F3E8CC' }}>
      <h1
        className="text-4xl font-bold tracking-wide mb-6 text-center uppercase"
        style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}
      >
        CONSULTAR PEDIDO
      </h1>

      <div
        className="p-6 rounded-2xl border mb-8 shadow-sm"
        style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
      >
        <p className="mb-4 text-xs font-mono" style={{ color: '#65513F' }}>
          Por seguridad y privacidad de tus datos, introduce tu número de pedido y el teléfono utilizado en la compra.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>
              Número de Pedido (ej: E51-000001) *
            </label>
            <input
              type="text"
              required
              placeholder="E51-XXXXXX"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full p-3 rounded-xl text-sm font-mono focus:outline-none"
              style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 uppercase tracking-wider" style={{ color: '#65513F' }}>
              Teléfono de contacto *
            </label>
            <input
              type="tel"
              required
              placeholder="Ej: 612345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 rounded-xl text-sm font-mono focus:outline-none"
              style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !orderNumber.trim() || !phone.trim()}
            className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 shadow-md uppercase text-sm"
            style={{
              backgroundColor: '#B88727',
              color: '#FFF7E5',
              fontFamily: 'Oswald, sans-serif',
            }}
          >
            {loading ? (
              'VERIFICANDO...'
            ) : (
              <>
                <Search className="w-4 h-4" /> CONSULTAR PEDIDO
              </>
            )}
          </button>
        </form>

        {error && <p className="mt-4 text-xs font-medium font-mono" style={{ color: '#A94F2F' }}>{error}</p>}
      </div>

      {searched && !loading && !error && (
        <div className="space-y-4">
          <h2
            className="font-bold text-xl mb-3 uppercase"
            style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}
          >
            Resultado de la búsqueda
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-2xl border border-dashed shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" style={{ color: '#65513F' }} />
              <p className="text-xs font-mono" style={{ color: '#65513F' }}>
                No hemos encontrado ningún pedido que coincida exactamente con ese número y teléfono.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.order_number}`}
                  className="block p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md"
                  style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span
                        className="text-2xl font-bold font-mono block"
                        style={{ color: '#A94F2F' }}
                      >
                        {order.order_number}
                      </span>
                      <p className="text-xs font-mono mt-1" style={{ color: '#65513F' }}>
                        {new Date(order.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                  <div className="mt-4 pt-3 border-t flex justify-between items-center" style={{ borderColor: '#E8D5A8' }}>
                    <span className="text-xs uppercase font-mono tracking-wider" style={{ color: '#65513F' }}>Total del Pedido</span>
                    <span
                      className="text-xl font-bold font-mono"
                      style={{ color: '#A94F2F' }}
                    >
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
