'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gift, Ticket, Send, RefreshCw, AlertCircle, CheckCircle2, Copy } from 'lucide-react';
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
  const [mode, setMode] = useState<'distribute' | 'generate'>('distribute');
  // Helper to copy coupon code to clipboard with feedback
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ text: 'Código copiado al portapapeles', type: 'success' });
    } catch (e) {
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
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsProcessing(false);
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
        
        {/* Mode Selector */}
        <div className="mb-4 flex space-x-4">
          <button type="button" onClick={() => setMode('generate')} className={`px-3 py-1 rounded ${mode === 'generate' ? 'bg-[#A94F2F] text-white' : 'bg-gray-200'}`}>Solo Generar</button>
          <button type="button" onClick={() => setMode('distribute')} className={`px-3 py-1 rounded ${mode === 'distribute' ? 'bg-[#A94F2F] text-white' : 'bg-gray-200'}`}>Generar y Enviar</button>
        </div>

        {/* Forms */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border rounded-2xl p-5 shadow-sm" style={{ borderColor: '#E8D5A8' }}>
            {mode === 'generate' ? (
              <>
                <h2 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  <Gift size={20} className="text-[#A94F2F]" />
                  Sólo Generar Cupones
                </h2>
                <p className="text-xs text-gray-500 mb-4">Genera códigos de descuento sin enviarlos por email.</p>
                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* inputs reuse same state */}
                  <div>
                    <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Cantidad</label>
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
                  <button type="submit" disabled={isProcessing} className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all text-white" style={{ backgroundColor: '#A94F2F' }}>
                    {isProcessing ? <RefreshCw className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Generar</>}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  <Gift size={20} className="text-[#A94F2F]" />
                  Generar & Enviar Masivo
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
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all text-white"
                    style={{ backgroundColor: '#A94F2F' }}
                  >
                    {isProcessing ? <RefreshCw className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Generar y Enviar</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
                <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Cantidad de Clientes</label>
                <input 
                  type="number" 
                  min="1" max="1000"
                  value={count} onChange={e => setCount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Valor del Descuento (€)</label>
                <input 
                  type="number" 
                  min="1" step="0.5"
                  value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))}
                  className="w-full p-2 border rounded-lg bg-gray-50 focus:outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 uppercase tracking-wider text-gray-700">Días de Validez</label>
                <input 
                  type="number" 
                  min="1" max="365"
                  value={daysValid} onChange={e => setDaysValid(Number(e.target.value))}
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
  className="w-full flex justify-center items-center gap-2 py-3 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 transition-all text-white"
  style={{ backgroundColor: '#A94F2F' }}
>
  {isProcessing ? <RefreshCw className="animate-spin w-5 h-5" /> : <><Send className="w-5 h-5" /> Generar y Enviar</>}
</button>
            </form>
          </div>
        </div>

        {/* Coupons List */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col h-full" style={{ borderColor: '#E8D5A8' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold uppercase tracking-wider" style={{ fontFamily: 'Oswald, sans-serif' }}>Últimos 50 Cupones</h2>
              <button onClick={fetchCoupons} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
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
                          <span className="inline-block px-2 py-1 rounded bg-gray-200 text-gray-600 text-xs font-bold">Usado</span>
                        ) : new Date(coupon.expires_at) < new Date() ? (
                          <span className="inline-block px-2 py-1 rounded bg-red-100 text-red-600 text-xs font-bold">Expirado</span>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Activo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {coupons.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-400 font-medium">
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
