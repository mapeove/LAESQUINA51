'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, MapPin, Save } from 'lucide-react';
import type { DeliveryZone } from '@/types';

export default function AdminZonesPage() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadZones() {
      const { data } = await supabase
        .from('delivery_zones')
        .select('*')
        .order('name', { ascending: true });

      if (!ignore && data) {
        setZones(data as DeliveryZone[]);
        setLoading(false);
      }
    }

    void loadZones();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  const handleAddZone = () => {
    const newZone: DeliveryZone = {
      id: crypto.randomUUID(),
      name: 'Nueva Zona Sevilla',
      postal_codes: ['41001'],
      delivery_fee: 0,
      min_order: 0,
      active: true,
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
    setZones(zones.filter((z) => z.id !== id));
  };

  if (loading) {
    return <div className="p-8 text-neutral-400">Cargando zonas de reparto...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto text-white space-y-8 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-mono" style={{ color: 'var(--brand-cream)' }}>
            Zonas de Reparto (Sevilla)
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configuración de costes de envío, código postal y pedido mínimo
          </p>
        </div>

        <button
          onClick={handleAddZone}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-yellow-500 text-black hover:bg-yellow-400 transition-all"
        >
          <Plus size={18} />
          <span>Añadir Zona</span>
        </button>
      </div>

      <div className="space-y-4">
        {zones.map((zone, i) => (
          <div key={zone.id || i} className="p-5 bg-neutral-900 rounded-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-neutral-800 pb-3">
              <MapPin className="text-yellow-500" size={18} />
              <input
                type="text"
                value={zone.name}
                onChange={(e) => {
                  const newZones = [...zones];
                  newZones[i].name = e.target.value;
                  setZones(newZones);
                }}
                className="bg-transparent font-bold text-lg text-white border-b border-dashed border-neutral-700 focus:border-yellow-500 focus:outline-none px-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Códigos Postales (separados por coma)</label>
                <input
                  type="text"
                  value={Array.isArray(zone.postal_codes) ? zone.postal_codes.join(', ') : zone.postal_codes}
                  onChange={(e) => {
                    const newZones = [...zones];
                    newZones[i].postal_codes = e.target.value.split(',').map((s) => s.trim());
                    setZones(newZones);
                  }}
                  className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Coste Envío (€)</label>
                <input
                  type="number"
                  step="0.50"
                  value={zone.delivery_fee ?? 0}
                  onChange={(e) => {
                    const newZones = [...zones];
                    newZones[i].delivery_fee = parseFloat(e.target.value);
                    setZones(newZones);
                  }}
                  className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-400 mb-1">Pedido Mínimo (€)</label>
                <input
                  type="number"
                  step="1.00"
                  value={zone.min_order ?? 0}
                  onChange={(e) => {
                    const newZones = [...zones];
                    newZones[i].min_order = parseFloat(e.target.value);
                    setZones(newZones);
                  }}
                  className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-xl text-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
              <label className="flex items-center space-x-2 text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={zone.active ?? true}
                  onChange={(e) => {
                    const newZones = [...zones];
                    newZones[i].active = e.target.checked;
                    setZones(newZones);
                  }}
                  className="w-4 h-4 rounded border-neutral-700 text-yellow-500 bg-neutral-800"
                />
                <span>Zona Activa</span>
              </label>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSaveZone(zone)}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-xl text-xs hover:bg-yellow-400 flex items-center space-x-1"
                >
                  <Save size={14} />
                  <span>Guardar</span>
                </button>
                <button
                  onClick={() => handleDeleteZone(zone.id)}
                  className="p-2 text-red-400 hover:bg-red-950/40 rounded-xl"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
