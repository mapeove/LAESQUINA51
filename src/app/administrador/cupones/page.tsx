'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gift, Ticket, Send, RefreshCw, AlertCircle, CheckCircle2, Copy, Trash2, Ban, CheckCircle, Mail } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  discount_amount: number;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export default function AdminCuponesPage() {
  const supabase = createClient();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [count, setCount] = useState(10);
  const [discountAmount, setDiscountAmount] = useState(5);
  const [daysValid, setDaysValid] = useState(15);
  const [specificEmails, setSpecificEmails] = useState('');
  const [mode, setMode] = useState<'distribute' | 'generate' | 'specific'>('distribute');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to copy coupon code to clipboard with feedback
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ text: 'Código copiado al portapapeles', type: 'success' });
    } catch {
      setMessage({ text: 'Error al copiar', type: 'error' });
    }
  };
  
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (!error && data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchCoupons();
  }, [supabase]);

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/distribute-coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count,
          discount_amount: discountAmount,
          days_valid: daysValid
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error en la distribución');
      }

      setMessage({ 
        text: `¡Éxito! Se generaron y enviaron ${data.sentCount} cupones aleatoriamente a clientes elegibles.`, 
        type: 'success' 
      });
      fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/admin/generate-coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count,
          discount_amount: discountAmount,
          days_valid: daysValid
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al generar cupones');
      }
      setMessage({
        text: `¡Éxito! Se generaron ${data.coupons?.length || count} cupones.`,
        type: 'success'
      });
      fetchCoupons();
      setCount(10);
      setDiscountAmount(5);
      setDaysValid(15);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSpecificSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage({ text: '', type: '' });

    try {
      const emailsList = specificEmails
        .split(/[\n,;]+/)
        .map((email) => email.trim())
        .filter(Boolean);

      if (emailsList.length === 0) {
        throw new Error('Por favor, ingresa al menos un correo electrónico');
      }

      const res = await fetch('/api/admin/distribute-coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmails: emailsList,
          discount_amount: discountAmount,
          days_valid: daysValid
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar cupones a destinatarios');
      }

      setMessage({
        text: `¡Éxito! Se generaron y enviaron ${data.sentCount} cupones a los destinatarios especificados.`,
        type: 'success'
      });
      setSpecificEmails('');
      fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el cupón ${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al eliminar');
      }
      setMessage({ text: `Cupón ${code} eliminado de la base de datos.`, type: 'success' });
      fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar';
      setMessage({ text: msg, type: 'error' });
    }
  };

  const handleToggleUsed = async (id: string, currentUsed: boolean, code: string) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, used: !currentUsed })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar');
      }
      setMessage({ 
        text: `Cupón ${code} ${!currentUsed ? 'inhabilitado' : 'activado'}.`, 
        type: 'success' 
      });
      fetchCoupons();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      setMessage({ text: msg, type: 'error' });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            <Ticket size={28} className="text-[#A94F2F]" />
            Gestión de Cupones
          </h1>
          <p className="text-sm font-mono opacity-80 mt-1">Crea y distribuye códigos de descuento para tus clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Mode Selector & Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4" style={{ borderColor: '#E8D5A8' }}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Modo</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'distribute' | 'generate' | 'specific')}
                className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A94F2F]"
              >
                <option value="generate">Generar para compartir (WhatsApp / Amigos / Familia)</option>
                <option value="distribute">Generar y enviar por correo masivo</option>
                <option value="specific">Enviar a correos específicos</option>
              </select>
            </div>

            {/* MODO 1: Generar para compartir */}
            {mode === 'generate' && (
              <>
                <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  <Ticket className="w-5 h-5 text-[#A94F2F]" />
                  Generar Cupones
                </h2>
                <p className="text-xs text-gray-500 mb-4">Crea cupones que quedarán guardados en la tabla para copiar y compartir directamente.</p>
                <form onSubmit={handleGenerate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Cantidad de Cupones</label>
                    <input type="number" min="1" max="1000" value={count} onChange={e => setCount(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Valor del Descuento (€)</label>
                    <input type="number" min="1" step="0.5" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Días de Validez</label>
                    <input type="number" min="1" max="365" value={daysValid} onChange={e => setDaysValid(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none" required />
                  </div>
                  {message.text && (
                    <div className={`p-3 rounded-lg flex items-start gap-2 text-xs font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      <span>{message.text}</span>
                    </div>
                  )}
                  <button type="submit" disabled={isProcessing} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all text-white shadow-sm" style={{ backgroundColor: '#A94F2F' }}>
                    {isProcessing ? <RefreshCw className="animate-spin w-5 h-5" /> : <><Ticket className="w-5 h-5" /> Generar Cupones</>}
                  </button>
                </form>
              </>
            )}

            {/* MODO 2: Generar y enviar masivo */}
            {mode === 'distribute' && (
              <>
                <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  <Gift className="w-5 h-5 text-[#A94F2F]" />
                  Generar y Enviar Masivo
                </h2>
                <p className="text-xs text-gray-500 mb-4">Se seleccionarán aleatoriamente N clientes que <strong>no hayan recibido</strong> un cupón en los últimos 3 meses y se les enviará por correo.</p>
                <form onSubmit={handleDistribute} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Cantidad de Clientes</label>
                    <input type="number" min="1" max="1000" value={count} onChange={e => setCount(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Valor del Descuento (€)</label>
                    <input type="number" min="1" step="0.5" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Días de Validez</label>
                    <input type="number" min="1" max="365" value={daysValid} onChange={e => setDaysValid(Number(e.target.value))} className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none" required />
                  </div>
                  {message.text && (
                    <div className={`p-3 rounded-lg flex items-start gap-2 text-xs font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      <span>{message.text}</span>
                    </div>
                  )}
                  <button type="submit" disabled={isProcessing} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all text-white shadow-sm" style={{ backgroundColor: '#A94F2F' }}>
                    {isProcessing ? <RefreshCw className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Generar y Enviar Masivo</>}
                  </button>
                </form>
              </>
            )}

            {/* MODO 3: Enviar a correos específicos */}
            {mode === 'specific' && (
              <>
                <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  <Mail className="w-5 h-5 text-[#A94F2F]" />
                  Enviar a Correos Específicos
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Escribe uno o varios correos electrónicos. Se generará un cupón único y se enviará por email a cada destinatario.
                </p>
                <form onSubmit={handleSpecificSend} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">
                      Correos Electrónicos (separados por coma o salto de línea)
                    </label>
                    <textarea
                      rows={3}
                      value={specificEmails}
                      onChange={(e) => setSpecificEmails(e.target.value)}
                      placeholder="cliente1@gmail.com, cliente2@gmail.com"
                      className="w-full p-2.5 border rounded-lg bg-gray-50 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#A94F2F]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Valor del Descuento (€)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Días de Validez</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={daysValid}
                      onChange={(e) => setDaysValid(Number(e.target.value))}
                      className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none"
                      required
                    />
                  </div>
                  {message.text && (
                    <div className={`p-3 rounded-lg flex items-start gap-2 text-xs font-medium ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                      <span>{message.text}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all text-white shadow-sm"
                    style={{ backgroundColor: '#A94F2F' }}
                  >
                    {isProcessing ? <RefreshCw className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Generar y Enviar a Destinatarios</>}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>

        {/* Coupons List */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col h-full" style={{ borderColor: '#E8D5A8' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>Últimos 50 Cupones</h2>
              <button onClick={fetchCoupons} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Refrescar lista">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <th className="p-3 font-bold">Código</th>
                    <th className="p-3 font-bold text-right">Valor</th>
                    <th className="p-3 font-bold">Expira</th>
                    <th className="p-3 font-bold text-center">Estado</th>
                    <th className="p-3 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-3 font-mono font-bold text-[#A94F2F]">
                        <span className="cursor-pointer hover:underline" onClick={() => copyToClipboard(coupon.code)} title="Click para copiar">{coupon.code}</span>
                        <button type="button" className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => copyToClipboard(coupon.code)} title="Copiar">
                          <Copy size={16} />
                        </button>
                      </td>
                      <td className="p-3 font-bold text-right">{formatPrice(coupon.discount_amount)}</td>
                      <td className="p-3 text-xs text-gray-600">
                        {new Date(coupon.expires_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">
                        {coupon.used ? (
                          <span className="inline-block px-2 py-1 rounded bg-gray-200 text-gray-600 text-xs font-bold">Inhabilitado / Usado</span>
                        ) : new Date(coupon.expires_at) < new Date() ? (
                          <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-bold">Expirado</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Activo</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleUsed(coupon.id, coupon.used, coupon.code)}
                            title={coupon.used ? "Activar cupón" : "Inhabilitar cupón"}
                            className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 ${coupon.used ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}`}
                          >
                            {coupon.used ? <CheckCircle size={14} /> : <Ban size={14} />}
                            <span className="hidden sm:inline">{coupon.used ? 'Activar' : 'Inhabilitar'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                            title="Eliminar cupón"
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {coupons.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                        No hay cupones generados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
