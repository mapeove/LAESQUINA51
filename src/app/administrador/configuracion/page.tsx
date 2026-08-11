'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, ShieldCheck, PhoneCall, Wallet } from 'lucide-react';

export default function AdminSettingsPage() {
  const [storeOpen, setStoreOpen] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('633184354');
  const [bizumPhone, setBizumPhone] = useState('633184354');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadSettings() {
      const { data } = await supabase.from('store_settings').select('*');

      if (!ignore && data) {
        const openSetting = data.find((s) => s.key === 'store_open');
        const waSetting = data.find((s) => s.key === 'whatsapp_number');
        const bizumSetting = data.find((s) => s.key === 'bizum_phone');

        if (openSetting) setStoreOpen(openSetting.value === 'true');
        if (waSetting) setWhatsappNumber(waSetting.value);
        if (bizumSetting) setBizumPhone(bizumSetting.value);

        setLoading(false);
      }
    }

    void loadSettings();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    await Promise.all([
      supabase.from('store_settings').upsert({ key: 'store_open', value: String(storeOpen) }, { onConflict: 'key' }),
      supabase.from('store_settings').upsert({ key: 'whatsapp_number', value: whatsappNumber }, { onConflict: 'key' }),
      supabase.from('store_settings').upsert({ key: 'bizum_phone', value: bizumPhone }, { onConflict: 'key' }),
    ]);

    setSaving(false);
    alert('Configuración guardada correctamente');
  };

  if (loading) {
    return <div className="p-8 text-neutral-400">Cargando configuración del negocio...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto text-white space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold font-mono" style={{ color: 'var(--brand-cream)' }}>
          Configuración General
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Ajustes operativos de apertura, notificaciones y pagos de La Esquina 51
        </p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* 1. Estado de apertura */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
            <ShieldCheck className="text-yellow-500" size={20} />
            <h2 className="text-lg font-bold font-mono">Interruptor General de Pedidos</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <div>
              <p className="font-bold text-sm">Recepción de Pedidos en la Web</p>
              <p className="text-xs text-neutral-400">
                {storeOpen ? 'La tienda está ABIERTA y aceptando pedidos en vivo.' : 'La tienda está CERRADA manualmente.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStoreOpen(!storeOpen)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                storeOpen ? 'bg-green-500 text-black' : 'bg-red-900/60 text-red-300'
              }`}
            >
              {storeOpen ? 'ABIERTA' : 'CERRADA'}
            </button>
          </div>
        </div>

        {/* 2. Teléfono WhatsApp */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
            <PhoneCall className="text-green-500" size={20} />
            <h2 className="text-lg font-bold font-mono">Notificaciones por WhatsApp</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Teléfono de Recepción de Notificaciones
            </label>
            <input
              type="text"
              required
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full max-w-sm p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-yellow-500"
            />
            <p className="text-[10px] text-neutral-500 mt-1">Formato español sin espacios (ej: 633184354)</p>
          </div>
        </div>

        {/* 3. Teléfono Bizum */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
          <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
            <Wallet className="text-purple-500" size={20} />
            <h2 className="text-lg font-bold font-mono">Pagos por Bizum</h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Número de Teléfono para recibir pagos por Bizum
            </label>
            <input
              type="text"
              required
              value={bizumPhone}
              onChange={(e) => setBizumPhone(e.target.value)}
              className="w-full max-w-sm p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white font-mono text-sm focus:outline-none focus:border-yellow-500"
            />
            <p className="text-[10px] text-neutral-500 mt-1">Número mostrado al cliente durante la confirmación de pago por Bizum</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-bold text-black text-sm"
          style={{ backgroundColor: 'var(--brand-yellow)', fontFamily: 'Oswald, sans-serif' }}
        >
          <Save size={18} />
          <span>{saving ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}</span>
        </button>
      </form>
    </div>
  );
}
