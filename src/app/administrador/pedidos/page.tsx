'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, MessageCircle, ChevronRight, Truck, Wallet, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Order, OrderStatus, DeliveryDriver } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/types';
import { formatPrice } from '@/lib/utils';
import OrderChat from '@/components/OrderChat';

const TABS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'PENDING', label: 'Recibido' },
  { id: 'PREPARING', label: 'Preparando' },
  { id: 'READY', label: 'Listo' },
  { id: 'OUT_FOR_DELIVERY', label: 'En reparto' },
  { id: 'DELIVERED', label: 'Recibos' },
  { id: 'CANCELLED', label: 'Cancelados' },
];

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setCurrentUserId(data.user.id);
    });
  }, [supabase]);

  const [updating, setUpdating] = useState(false);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    let ignore = false;
    async function loadOrdersAndDrivers() {
      const [ordersRes, driversRes, productsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, items:order_items(*), driver:delivery_drivers(*)')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('delivery_drivers')
          .select('*')
          .eq('active', true)
          .order('name', { ascending: true }),
        supabase
          .from('products')
          .select('id, image, image_url')
      ]);

      if (!ignore) {
        if (ordersRes.data) {
          const productsMap = new Map((productsRes.data || []).map(p => [p.id, p]));
          const typedOrders = (ordersRes.data as Order[]).map(order => ({
            ...order,
            items: order.items?.map(item => ({
              ...item,
              product: productsMap.get((item as unknown as Record<string, string>).product_id) || null
            }))
          })) as unknown as Order[];
          setOrders(typedOrders);

          // Always ensure the currently selected order is hydrated with the latest data (e.g. items)
          setSelectedOrder((prev) => {
            if (!prev) return prev;
            return typedOrders.find((o) => o.id === prev.id) || prev;
          });

          const idParam = searchParams.get('id');
          if (idParam) {
            const order = typedOrders.find((o) => o.id === idParam);
            if (order) setSelectedOrder(order);
          }
        }
        if (driversRes.data) setDrivers(driversRes.data as DeliveryDriver[]);
        setLoading(false);
      }
    }

    void loadOrdersAndDrivers();
    const interval = setInterval(() => {
      void loadOrdersAndDrivers();
    }, 30000);

    const handleNewOrder = (e: Event) => {
      const customEvent = e as CustomEvent<Order>;
      const newOrder = customEvent.detail;
      
      // Fetch full order data including items
      void loadOrdersAndDrivers();
      
      setHighlightedOrderId(newOrder.id);
      setTimeout(() => {
        setHighlightedOrderId(null);
      }, 5000);
    };

    window.addEventListener('new-admin-order', handleNewOrder);

    return () => {
      ignore = true;
      clearInterval(interval);
      window.removeEventListener('new-admin-order', handleNewOrder);
    };
  }, [supabase, searchParams]);

  const handleUpdateStatus = async (status: OrderStatus) => {
    if (!selectedOrder) return;
    setUpdating(true);

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', selectedOrder.id);

    if (!error) {
      const updatedOrder = { ...selectedOrder, status };
      setSelectedOrder(updatedOrder);
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
      
      if (status === 'DELIVERED') {
        setActiveTab('PENDING');
        setSelectedOrder(null);
      }
    }
    setUpdating(false);
  };

  const handleAssignDriver = async (driverId: string | null) => {
    if (!selectedOrder) return;
    setUpdating(true);

    const { error } = await supabase
      .from('orders')
      .update({ driver_id: driverId || null })
      .eq('id', selectedOrder.id);

    if (!error) {
      const assignedDriver = drivers.find((d) => d.id === driverId);
      const updatedOrder = { 
        ...selectedOrder, 
        driver_id: driverId || null, 
        driver: assignedDriver 
      };
      setSelectedOrder(updatedOrder);
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
    }
    setUpdating(false);
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', selectedOrder.id);

    if (!error) {
      setOrders(orders.filter((o) => o.id !== selectedOrder.id));
      setSelectedOrder(null);
      setShowDeleteConfirm(false);
    } else {
      console.error('Error deleting order:', error);
    }
    setIsDeleting(false);
  };

  const filteredOrders =
    activeTab === 'ALL'
      ? orders
      : orders.filter((o) => o.status === activeTab);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ordersToday = orders.filter(o => new Date(o.created_at) >= today).length;
  const activeOrders = orders.filter(o => o.status === 'PREPARING').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex h-[calc(100vh-64px)] md:h-screen flex-col text-white animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold font-mono" style={{ color: 'var(--brand-cream)' }}>
          Gestión de Pedidos
        </h1>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
            <span className="text-xs uppercase font-bold text-neutral-400">Hoy</span>
            <span className="text-lg font-mono font-bold text-white">{ordersToday}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-orange-900/20 border border-orange-900/50 flex items-center gap-3">
            <span className="text-xs uppercase font-bold text-orange-500">Preparando</span>
            <span className="text-lg font-mono font-bold text-orange-400">{activeOrders}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto space-x-2 mb-6 pb-2 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-yellow-500 text-black'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List (Responsive) */}
      <div className="flex-1 rounded-2xl border border-neutral-800 bg-neutral-900 flex flex-col overflow-hidden">
        
        {/* Mobile Cards View */}
        <div className="md:hidden overflow-y-auto flex-1 p-4 space-y-4">
          {loading ? (
            <div className="text-center text-neutral-500 py-8 font-medium text-sm">Cargando pedidos...</div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center text-neutral-500 py-8 font-medium text-sm">No hay pedidos en esta sección.</div>
          ) : (
            filteredOrders.map((order) => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-neutral-800/40 border rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-colors ${
                  selectedOrder?.id === order.id ? 'border-yellow-500/50 bg-neutral-800' : 'border-neutral-800'
                } ${highlightedOrderId === order.id ? 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono font-bold text-yellow-500 text-lg flex items-center gap-2">
                      #{order.order_number}
                      {highlightedOrderId === order.id && (
                        <span className="px-1.5 py-0.5 bg-orange-600 text-white text-[9px] rounded-sm font-sans uppercase animate-pulse">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {new Date(order.created_at).toLocaleString('es-ES', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg text-white">{formatPrice(order.total)}</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      ORDER_STATUS_COLORS[order.status] ?? 'bg-neutral-800 text-neutral-300'
                    }`}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800/50 flex justify-between items-end">
                  <div>
                    <div className="font-bold text-neutral-200 text-sm">{order.customer_name}</div>
                    <div className="text-xs font-mono text-neutral-400">{order.customer_phone}</div>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors">
                    VER PEDIDO <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:flex overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse h-fit">
            <thead className="sticky top-0 bg-neutral-900 z-10 shadow-sm">
              <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <th className="px-6 py-4 font-medium">Número</th>
                <th className="px-6 py-4 font-medium">Fecha/Hora</th>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Pago</th>
                <th className="px-6 py-4 font-medium">Repartidor</th>
                <th className="px-6 py-4 font-medium">Total</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-neutral-500 text-xs">
                    Cargando pedidos...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-neutral-500 text-xs">
                    No hay pedidos en esta sección.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`hover:bg-neutral-800/50 cursor-pointer border-b border-neutral-800 transition-colors duration-500 ${
                      selectedOrder?.id === order.id ? 'bg-neutral-800/80' : ''
                    } ${
                      highlightedOrderId === order.id ? 'bg-orange-900/40 border-orange-500/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-mono font-bold text-yellow-500 flex items-center gap-2">
                      #{order.order_number}
                      {highlightedOrderId === order.id && (
                        <span className="px-1.5 py-0.5 bg-orange-600 text-white text-[9px] rounded-sm font-sans uppercase animate-pulse">
                          Nuevo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-400">
                      {new Date(order.created_at).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-200">
                      {order.customer_name}
                      <span className="block text-xs font-mono text-neutral-400">{order.customer_phone}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${order.payment_method === 'BIZUM' ? 'bg-purple-900/60 text-purple-300' : 'bg-green-900/60 text-green-300'}`}>
                        {order.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-neutral-300">
                      {order.driver ? (
                        <span className="flex items-center gap-1 text-purple-300">
                          <Truck size={14} /> {order.driver.name}
                        </span>
                      ) : (
                        <span className="text-neutral-500 italic">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-sm">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ORDER_STATUS_COLORS[order.status] ?? 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-neutral-400 hover:text-white rounded-lg">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Bottom Sheet Detail */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-xs">
          {/* Use max-h-[100dvh] for mobile bottom sheet effect, rounded top. On md: max-h-[90dvh] rounded-2xl */}
          <div 
            className="w-full md:max-w-4xl bg-[#F3E8CC] border-t md:border border-[#B88727] h-[100dvh] md:h-auto md:max-h-[90dvh] rounded-t-3xl md:rounded-2xl overflow-y-auto flex flex-col shadow-2xl relative"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Sticky Header */}
            <div className="sticky top-0 bg-[#F3E8CC] z-10 px-6 py-5 border-b border-[#D5C29A] flex justify-between items-center rounded-t-3xl md:rounded-2xl">
              <div>
                <h2 className="text-2xl font-bold font-mono text-[#3A2418]">
                  #{selectedOrder.order_number}
                </h2>
                <p className="text-sm font-bold text-[#A94F2F]">
                  {new Date(selectedOrder.created_at).toLocaleString('es-ES')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full hover:bg-[#E8D5A8] text-[#65513F] transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 text-[#3A2418]">
              {/* Status Pills replacing Select */}
              <div className="mb-8 bg-white p-5 rounded-2xl border border-[#E8D5A8] shadow-sm">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#65513F] mb-3">
                  ESTADO
                </label>
                <div className="flex flex-wrap gap-2">
                  {['PENDING', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'].map((st) => {
                    // Logic for actual/completed/pending
                    const statusOrder = ['PENDING', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED'];
                    const currentIdx = statusOrder.indexOf(selectedOrder.status);
                    const btnIdx = statusOrder.indexOf(st);
                    
                    let btnStyle = "";
                    if (selectedOrder.status === st) {
                      // Actual = resaltado
                      btnStyle = "bg-[#A94F2F] text-white border-[#A94F2F] ring-2 ring-[#A94F2F]/30 ring-offset-1";
                    } else if (btnIdx < currentIdx && currentIdx !== -1) {
                      // Completado = tono de marca
                      btnStyle = "bg-[#B88727] text-white border-[#B88727]";
                    } else {
                      // Pendiente = neutro
                      btnStyle = "bg-[#F3E8CC] text-[#65513F] border-[#D5C29A] hover:bg-[#E8D5A8]";
                    }

                    return (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(st as OrderStatus)}
                        disabled={updating || selectedOrder.status === 'CANCELLED'}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all ${btnStyle} ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {ORDER_STATUS_LABELS[st as OrderStatus] || st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Driver Assignment */}
              <div className="mb-6 bg-white p-5 rounded-2xl border border-[#E8D5A8] shadow-sm space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#65513F] flex items-center gap-2">
                  <Truck size={16} className="text-[#A94F2F]" /> Repartidor Asignado
                </label>
                <select
                  value={selectedOrder.driver_id || ''}
                  onChange={(e) => handleAssignDriver(e.target.value || null)}
                  disabled={updating}
                  className="w-full p-3 rounded-xl bg-[#F3E8CC] border border-[#D5C29A] text-[#3A2418] font-bold focus:outline-none focus:border-[#B88727] text-sm"
                >
                  <option value="">Sin asignar</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Layout for Customer Info & Order Items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Info */}
                <div className="space-y-4 text-sm bg-white p-5 rounded-2xl border border-[#E8D5A8] shadow-sm h-full">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-[#A94F2F] mb-1">Cliente</h3>
                    <p className="font-bold text-[#3A2418] text-lg">{selectedOrder.customer_name}</p>
                    <p className="font-mono text-[#65513F]">{selectedOrder.customer_phone}</p>
                    {selectedOrder.customer_email && (
                      <p className="text-[#65513F] text-xs mt-1">{selectedOrder.customer_email}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#D5C29A]/40">
                    <h3 className="text-xs font-bold uppercase text-[#A94F2F] mb-1">Dirección de Entrega</h3>
                    <p className="text-[#3A2418] font-medium">{selectedOrder.delivery_address}</p>
                    {selectedOrder.delivery_zone_name && (
                      <span className="inline-block mt-2 px-2 py-1 rounded bg-[#B88727]/20 text-[#B88727] text-[10px] font-bold uppercase">
                        Zona: {selectedOrder.delivery_zone_name}
                      </span>
                    )}
                  </div>

                  {/* Payment info */}
                  <div className="mt-4 p-3 rounded-xl bg-[#F3E8CC] border border-[#D5C29A] flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wallet size={16} className="text-[#A94F2F]" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#65513F] block">Pago:</span>
                        <p className="text-sm font-bold font-mono text-[#3A2418]">{selectedOrder.payment_method}</p>
                      </div>
                    </div>

                    {selectedOrder.payment_method === 'CASH' && selectedOrder.cash_change_for && (
                      <div className="text-right">
                        <span className="text-[10px] text-[#65513F] font-bold uppercase block">Cambio para</span>
                        <p className="text-sm font-mono font-bold text-[#A94F2F]">{formatPrice(selectedOrder.cash_change_for)}</p>
                      </div>
                    )}

                    {selectedOrder.payment_method === 'BIZUM' && (
                      <div className="text-right">
                        <span className="text-[10px] text-[#65513F] font-bold uppercase block text-orange-700">Importante</span>
                        <p className="text-[11px] font-bold text-[#A94F2F] leading-tight">Cobrar por<br/>Bizum al entregar</p>
                      </div>
                    )}
                  </div>

                  {selectedOrder.notes && (
                    <div className="pt-2">
                      <h3 className="text-xs font-bold uppercase text-[#A94F2F] mb-1">Observaciones</h3>
                      <p className="text-sm font-medium italic text-[#A94F2F] bg-[#A94F2F]/10 p-3 rounded-xl border border-[#A94F2F]/20">
                        &quot;{selectedOrder.notes}&quot;
                      </p>
                    </div>
                  )}
                </div>

              {/* WhatsApp direct contact */}
              <a
                href={`https://wa.me/34${selectedOrder.customer_phone.replace(/\s+/g, '')}?text=${encodeURIComponent(
                  `Hola ${selectedOrder.customer_name}, te escribimos de La Esquina 51 sobre tu pedido #${selectedOrder.order_number}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-6 text-white text-sm"
                style={{ backgroundColor: '#25D366' }}
              >
                <MessageCircle size={18} />
                <span>Contactar Cliente por WhatsApp</span>
              </a>

                {/* Items summary */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8D5A8] shadow-sm h-full flex flex-col">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#A94F2F] mb-4">Productos del pedido</h3>
                  <div className="space-y-4 mb-4 flex-1">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-3 p-4 rounded-xl bg-[#F3E8CC] border border-[#D5C29A] text-[#3A2418]">
                          <div className="flex gap-4">
                            {/* Product photo */}
                            {(() => {
                              const joinedProduct = (item as unknown as Record<string, unknown>).product as Record<string, unknown> | null | undefined;
                              const imgSrc = joinedProduct?.image_url || joinedProduct?.image || null;
                              return imgSrc ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={String(imgSrc)}
                                  alt={item.product_name || (item as unknown as Record<string, unknown>).product_name_snapshot as string}
                                  className="w-16 h-16 rounded-xl object-cover shrink-0 border-2 border-[#D5C29A]"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-[#E8D5A8] shrink-0 flex items-center justify-center text-[#B88727] text-xl border-2 border-[#D5C29A]">🍔</div>
                              );
                            })()}
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-lg text-[#3A2418] uppercase leading-tight mb-1">
                                {item.product_name || (item as unknown as Record<string, unknown>).product_name_snapshot as string}
                              </h4>
                              <p className="text-sm font-mono text-[#65513F] mb-2 border-b border-[#D5C29A]/40 pb-2">
                                <span className="font-bold text-[#A94F2F]">{item.quantity} ×</span> {formatPrice(item.product_price)}
                              </p>

                              {/* Options and Extras */}
                              <div className="space-y-1">
                                {(((item as unknown as Record<string, unknown>).options || (item as unknown as Record<string, unknown>).options_snapshot) as Record<string, unknown>[] || []).map((opt: unknown, oidx: number) => {
                                  const optRecord = opt as Record<string, unknown>;
                                  
                                  // Render note distinctly
                                  if (optRecord.is_note) {
                                    return (
                                      <div key={oidx} className="mt-2 p-3 rounded-lg bg-white border-2 border-[#A94F2F]/20">
                                        <p className="text-xs font-bold text-[#A94F2F] uppercase mb-1">📝 PETICIÓN DEL CLIENTE</p>
                                        <p className="text-sm font-medium text-[#3A2418]">&quot;{optRecord.option_name as string}&quot;</p>
                                      </div>
                                    );
                                  }

                                  // Normal option
                                  return (
                                    <p key={oidx} className="text-xs font-bold text-[#65513F] flex items-start gap-1.5">
                                      <span className="text-[#A94F2F] mt-0.5">•</span> {(optRecord.name || optRecord.option_name) as string}
                                    </p>
                                  );
                                })}

                                {(((item as unknown as Record<string, unknown>).extras || (item as unknown as Record<string, unknown>).extras_snapshot) as Record<string, unknown>[] || []).map((ext: unknown, eidx: number) => {
                                  const extRecord = ext as Record<string, unknown>;
                                  return (
                                    <p key={`ext-${eidx}`} className="text-xs font-bold text-[#A94F2F] flex items-start gap-1.5">
                                      <span className="mt-0.5">+</span> {(extRecord.name || extRecord.extra_name) as string}
                                    </p>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end items-center border-t border-[#D5C29A]/60 pt-2 mt-1">
                            <span className="text-xs text-[#65513F] uppercase font-bold mr-3">Subtotal</span>
                            <span className="font-mono font-black text-lg text-[#A94F2F]">{formatPrice(item.line_total || (item as unknown as Record<string, unknown>).item_total as number)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  <div className="border-t border-[#D5C29A]/60 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-[#65513F]">
                      <span>Subtotal</span>
                      <span className="font-mono">{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#65513F]">
                      <span>Gastos de envío</span>
                      <span className="font-mono">{formatPrice(selectedOrder.delivery_fee)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-black border-t-2 border-[#D5C29A] pt-2 mt-1">
                      <span className="uppercase text-[#3A2418]">TOTAL</span>
                      <span className="font-mono text-[#A94F2F]">{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Supervisor (OWNER) */}
              {currentUserId && selectedOrder.driver_id && ['READY', 'OUT_FOR_DELIVERY', 'ARRIVED', 'DELIVERED', 'CANCELLED'].includes(selectedOrder.status) && (
                <div className="mb-8">
                  <OrderChat orderId={selectedOrder.id} currentUserId={currentUserId} userRole="owner" />
                </div>
              )}

              {/* Destructive Actions */}
              <div className="flex flex-col md:flex-row gap-4 mt-8 pt-6 border-t border-[#D5C29A]/50">
                <button
                  onClick={() => handleUpdateStatus('CANCELLED')}
                  disabled={updating || selectedOrder.status === 'CANCELLED'}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-colors border-red-500 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
                >
                  CANCELAR PEDIDO
                </button>
                
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 transition-colors border-neutral-300 text-neutral-500 hover:border-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                    <span>BORRAR PEDIDO</span>
                  </button>
                ) : (
                  <div className="flex-1 p-4 rounded-xl border-2 border-red-500 bg-red-50">
                    <p className="text-sm font-bold text-red-600 mb-2">¿Eliminar definitivamente?</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="flex-1 py-2 rounded-lg text-xs font-bold text-neutral-600 bg-neutral-200 hover:bg-neutral-300"
                      >
                        CANCELAR
                      </button>
                      <button
                        onClick={handleDeleteOrder}
                        disabled={isDeleting}
                        className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? 'ELIMINANDO...' : 'ELIMINAR DEFINITIVAMENTE'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400">Cargando pedidos...</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}
