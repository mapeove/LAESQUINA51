'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { OpeningHour, DeliveryZone } from '@/types';

interface StoreSettingsData {
  id?: string;
  store_open: boolean;
  whatsapp_number: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettingsData | null>(null);
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const [setRes, hoursRes, zonesRes] = await Promise.all([
        supabase.from('store_settings').select('*').single(),
        supabase.from('opening_hours').select('*').order('day_of_week', { ascending: true }),
        supabase.from('delivery_zones').select('*').order('name', { ascending: true })
      ]);

      if (!ignore) {
        if (setRes.data) {
          setSettings(setRes.data as StoreSettingsData);
        } else {
          setSettings({ store_open: true, whatsapp_number: '633184354' });
        }
        if (hoursRes.data) setHours(hoursRes.data as OpeningHour[]);
        if (zonesRes.data) setZones(zonesRes.data as DeliveryZone[]);

        setLoading(false);
      }
    }
    void loadData();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    if (settings.id) {
      await supabase.from('store_settings').update(settings).eq('id', settings.id);
    } else {
      const { data } = await supabase.from('store_settings').insert(settings).select().single();
      if (data) setSettings(data as StoreSettingsData);
    }
    setSaving(false);
    alert('Configuración guardada correctamente');
  };

  const handleSaveHours = async () => {
    setSaving(true);
    for (const h of hours) {
      await supabase.from('opening_hours').update(h).eq('id', h.id);
    }
    setSaving(false);
    alert('Horarios guardados correctamente');
  };

  const handleAddZone = () => {
    const newZone: DeliveryZone = { 
      id: crypto.randomUUID(),
      name: 'Nueva Zona', 
      postal_codes: ['41001'], 
      delivery_fee: 0, 
      min_order: 0, 
      active: true 
    };
    setZones([...zones, newZone]);
  };

  const handleSaveZone = async (zone: DeliveryZone) => {
    setSaving(true);
    const { error } = await supabase.from('delivery_zones').upsert(zone);
    setSaving(false);
    if (!error) alert('Zona guardada correctamente');
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('¿Eliminar esta zona de reparto?')) return;
    await supabase.from('delivery_zones').delete().eq('id', id);
    setZones(zones.filter(z => z.id !== id));
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  if (loading) {
    return <div className="p-8 text-neutral-400">Cargando configuración...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto text-white space-y-8">
      <h1 className="text-3xl font-bold" style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}>
        Configuración de la Tienda
      </h1>

      {/* 1. Estado de la tienda */}
      <section className="p-6 rounded-2xl border border-neutral-800 space-y-4" style={{ backgroundColor: '#111111' }}>
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>Estado del Comercio</h2>
        
        <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-xl border border-neutral-800">
          <div>
            <p className="font-bold text-base">Recepción de Pedidos</p>
            <p className="text-xs text-neutral-400">
              {settings?.store_open ? 'La tienda está ABIERTA para recibir pedidos.' : 'La tienda está CERRADA manualmente.'}
            </p>
          </div>

          <button
            onClick={() => setSettings(settings ? { ...settings, store_open: !settings.store_open } : null)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              settings?.store_open ? 'bg-green-500 text-black' : 'bg-red-900/60 text-red-300'
            }`}
          >
            {settings?.store_open ? 'ABIERTA' : 'CERRADA'}
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1">Teléfono WhatsApp Notificaciones</label>
          <input
            type="text"
            value={settings?.whatsapp_number || ''}
            onChange={(e) => setSettings(settings ? { ...settings, whatsapp_number: e.target.value } : null)}
            className="w-full max-w-xs p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-yellow-500"
          />
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-black"
          style={{ backgroundColor: 'var(--brand-yellow)' }}
        >
          <Save size={18} />
          <span>{saving ? 'Guardando...' : 'Guardar Estado'}</span>
        </button>
      </section>

      {/* 2. Horarios */}
      <section className="p-6 rounded-2xl border border-neutral-800 space-y-4" style={{ backgroundColor: '#111111' }}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>Horario Semanal</h2>
          <button
            onClick={handleSaveHours}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-black text-sm"
            style={{ backgroundColor: 'var(--brand-yellow)' }}
          >
            <Save size={16} />
            <span>Guardar Horarios</span>
          </button>
        </div>

        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={h.id || i} className="flex items-center justify-between p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-sm">
              <span className="w-28 font-bold text-neutral-200">{dayNames[h.day_of_week] || `Día ${h.day_of_week}`}</span>
              
              <div className="flex items-center space-x-3">
                <input
                  type="time"
                  value={h.open_time}
                  onChange={(e) => {
                    const newHours = [...hours];
                    newHours[i].open_time = e.target.value;
                    setHours(newHours);
                  }}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white"
                />
                <span className="text-neutral-500">a</span>
                <input
                  type="time"
                  value={h.close_time}
                  onChange={(e) => {
                    const newHours = [...hours];
                    newHours[i].close_time = e.target.value;
                    setHours(newHours);
                  }}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white"
                />
              </div>

              <button
                onClick={() => {
                  const newHours = [...hours];
                  newHours[i].active = !newHours[i].active;
                  setHours(newHours);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  h.active ? 'bg-green-900/60 text-green-300' : 'bg-neutral-800 text-neutral-500'
                }`}
              >
                {h.active ? 'Abierto' : 'Cerrado'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Zonas de reparto */}
      <section className="p-6 rounded-2xl border border-neutral-800 space-y-4" style={{ backgroundColor: '#111111' }}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>Zonas de Reparto (Sevilla)</h2>
          <button
            onClick={handleAddZone}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-black text-sm"
            style={{ backgroundColor: 'var(--brand-yellow)' }}
          >
            <Plus size={16} />
            <span>Añadir Zona</span>
          </button>
        </div>

        <div className="space-y-4">
          {zones.map((zone, i) => (
            <div key={zone.id || i} className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">Nombre Zona</label>
                  <input
                    type="text"
                    value={zone.name}
                    onChange={(e) => {
                      const newZones = [...zones];
                      newZones[i].name = e.target.value;
                      setZones(newZones);
                    }}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-neutral-400 mb-1">Códigos Postales (separados por coma)</label>
                  <input
                    type="text"
                    value={Array.isArray(zone.postal_codes) ? zone.postal_codes.join(', ') : zone.postal_codes}
                    onChange={(e) => {
                      const newZones = [...zones];
                      newZones[i].postal_codes = e.target.value.split(',').map(s => s.trim());
                      setZones(newZones);
                    }}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <button
                    onClick={() => handleSaveZone(zone)}
                    className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg text-xs"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => handleDeleteZone(zone.id)}
                    className="p-2 text-red-400 hover:bg-red-900/40 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
