'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Trash2, Calendar, Clock } from 'lucide-react';
import type { OpeningHour, SpecialOpeningHour } from '@/types';

export default function AdminHoursPage() {
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialOpeningHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSpecial, setNewSpecial] = useState<Partial<SpecialOpeningHour>>({
    special_date: '',
    open_time: '19:00',
    close_time: '00:00',
    is_closed: false,
    notes: ''
  });
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadHoursData() {
      const [hoursRes, specialRes] = await Promise.all([
        supabase.from('opening_hours').select('*').order('day_of_week', { ascending: true }),
        supabase.from('special_opening_hours').select('*').order('special_date', { ascending: true })
      ]);

      if (!ignore) {
        if (hoursRes.data) setHours(hoursRes.data as OpeningHour[]);
        if (specialRes.data) setSpecialHours(specialRes.data as SpecialOpeningHour[]);
        setLoading(false);
      }
    }

    void loadHoursData();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  const handleSaveHours = async () => {
    setSaving(true);
    for (const h of hours) {
      await supabase.from('opening_hours').update(h).eq('id', h.id);
    }
    setSaving(false);
    alert('Horarios semanales guardados correctamente');
  };

  const handleAddSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecial.special_date) return;

    setSaving(true);
    const { data, error } = await supabase
      .from('special_opening_hours')
      .upsert({
        special_date: newSpecial.special_date,
        open_time: newSpecial.open_time || '19:00',
        close_time: newSpecial.close_time || '00:00',
        is_closed: newSpecial.is_closed ?? false,
        notes: newSpecial.notes || null
      }, { onConflict: 'special_date' })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setSpecialHours([...specialHours.filter(s => s.special_date !== data.special_date), data as SpecialOpeningHour]);
      setNewSpecial({ special_date: '', open_time: '19:00', close_time: '00:00', is_closed: false, notes: '' });
    }
  };

  const handleDeleteSpecial = async (id: string) => {
    if (!confirm('¿Eliminar esta excepción de horario?')) return;
    await supabase.from('special_opening_hours').delete().eq('id', id);
    setSpecialHours(specialHours.filter(s => s.id !== id));
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  if (loading) {
    return <div className="p-8 text-neutral-400">Cargando horarios...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto text-white space-y-8 animate-fade-up">
      <div>
        <h1 className="text-3xl font-bold font-mono" style={{ color: 'var(--brand-cream)' }}>
          Gestión de Horarios
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Configura el horario semanal regular y días especiales o festivos
        </p>
      </div>

      {/* 1. Horario Semanal */}
      <section className="p-6 rounded-2xl border border-neutral-800 space-y-4 bg-neutral-900">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <h2 className="text-lg font-bold font-mono flex items-center gap-2">
            <Clock size={18} className="text-yellow-500" /> Horario Semanal Regular
          </h2>
          <button
            onClick={handleSaveHours}
            disabled={saving}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-black text-xs bg-yellow-500 hover:bg-yellow-400 transition-all"
          >
            <Save size={16} />
            <span>Guardar Horarios</span>
          </button>
        </div>

        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={h.id || i} className="flex items-center justify-between p-3.5 bg-neutral-950 rounded-xl border border-neutral-800 text-sm">
              <span className="w-28 font-bold text-neutral-200 font-mono">{dayNames[h.day_of_week] || `Día ${h.day_of_week}`}</span>
              
              <div className="flex items-center space-x-3">
                <input
                  type="time"
                  value={h.open_time}
                  onChange={(e) => {
                    const newHours = [...hours];
                    newHours[i].open_time = e.target.value;
                    setHours(newHours);
                  }}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white font-mono text-xs"
                />
                <span className="text-neutral-500 text-xs">a</span>
                <input
                  type="time"
                  value={h.close_time}
                  onChange={(e) => {
                    const newHours = [...hours];
                    newHours[i].close_time = e.target.value;
                    setHours(newHours);
                  }}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg p-2 text-white font-mono text-xs"
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

      {/* 2. Días Especiales / Festivos */}
      <section className="p-6 rounded-2xl border border-neutral-800 space-y-4 bg-neutral-900">
        <h2 className="text-lg font-bold font-mono flex items-center gap-2 border-b border-neutral-800 pb-4">
          <Calendar size={18} className="text-yellow-500" /> Días Especiales y Festivos
        </h2>

        {/* Form para nuevo día especial */}
        <form onSubmit={handleAddSpecial} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
          <span className="text-xs font-bold uppercase text-neutral-400">Añadir Excepción de Horario</span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-neutral-400 uppercase mb-1">Fecha *</label>
              <input
                type="date"
                required
                value={newSpecial.special_date || ''}
                onChange={(e) => setNewSpecial({ ...newSpecial, special_date: e.target.value })}
                className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 uppercase mb-1">Apertura / Cierre</label>
              <div className="flex items-center space-x-1">
                <input
                  type="time"
                  disabled={newSpecial.is_closed}
                  value={newSpecial.open_time || '19:00'}
                  onChange={(e) => setNewSpecial({ ...newSpecial, open_time: e.target.value })}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs font-mono disabled:opacity-30"
                />
                <input
                  type="time"
                  disabled={newSpecial.is_closed}
                  value={newSpecial.close_time || '00:00'}
                  onChange={(e) => setNewSpecial({ ...newSpecial, close_time: e.target.value })}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs font-mono disabled:opacity-30"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-neutral-400 uppercase mb-1">Notas / Motivo</label>
              <input
                type="text"
                placeholder="Ej: Festivo 15 de Agosto"
                value={newSpecial.notes || ''}
                onChange={(e) => setNewSpecial({ ...newSpecial, notes: e.target.value })}
                className="w-full p-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-xs"
              />
            </div>

            <div className="flex items-center space-x-2 pt-5">
              <label className="flex items-center space-x-1 text-xs text-neutral-300">
                <input
                  type="checkbox"
                  checked={newSpecial.is_closed || false}
                  onChange={(e) => setNewSpecial({ ...newSpecial, is_closed: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 text-yellow-500 bg-neutral-800"
                />
                <span>Cerrado todo el día</span>
              </label>

              <button
                type="submit"
                className="px-4 py-2.5 bg-yellow-500 text-black font-bold rounded-lg text-xs hover:bg-yellow-400 ml-auto"
              >
                Añadir
              </button>
            </div>
          </div>
        </form>

        {/* Lista de excepciones */}
        <div className="space-y-2">
          {specialHours.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-2">No hay excepciones configuradas.</p>
          ) : (
            specialHours.map((special) => (
              <div key={special.id} className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                <div className="flex items-center space-x-3 font-mono">
                  <span className="font-bold text-yellow-500">{special.special_date}</span>
                  <span>
                    {special.is_closed ? (
                      <span className="text-red-400 font-bold">CERRADO FESTIVO</span>
                    ) : (
                      `${special.open_time} - ${special.close_time}`
                    )}
                  </span>
                  {special.notes && <span className="text-neutral-400 italic">({special.notes})</span>}
                </div>

                <button
                  onClick={() => handleDeleteSpecial(special.id)}
                  className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
