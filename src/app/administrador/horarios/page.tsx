'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Trash2, Calendar, Clock, Plus } from 'lucide-react';
import type { OpeningHour, SpecialOpeningHour } from '@/types';

const DAYS = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 0, name: 'Domingo' }
];

function TimeInput({
  value,
  onChange,
  disabled
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [localVal, setLocalVal] = useState(value ? value.substring(0, 5) : '');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalVal(value ? value.substring(0, 5) : '');
  }, [value]);

  const handleBlur = () => {
    let parsed = localVal.trim();
    if (!parsed) {
      onChange('');
      return;
    }

    if (/^\d:\d{2}$/.test(parsed)) parsed = `0${parsed}`;
    
    if (/^\d{1,2}$/.test(parsed)) {
      const num = parseInt(parsed, 10);
      if (num >= 0 && num <= 23) parsed = `${num.toString().padStart(2, '0')}:00`;
    }

    setLocalVal(parsed);
    onChange(parsed);
  };

  const isValid = !localVal || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(localVal);

  return (
    <input
      type="text"
      inputMode="text"
      placeholder="HH:mm"
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      disabled={disabled}
      className={`bg-transparent text-white font-mono text-base outline-none w-[65px] text-center border-b transition-colors disabled:opacity-30 ${
        !isValid ? 'border-red-500 text-red-400' : 'border-neutral-700 focus:border-yellow-500'
      }`}
    />
  );
}

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
        supabase.from('opening_hours').select('*').order('open_time', { ascending: true }),
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
    // Validation
    for (const day of DAYS) {
      const daySlots = hours.filter(h => h.day_of_week === day.id && h.active);
      if (daySlots.length === 0) continue;
      
      for (let i = 0; i < daySlots.length; i++) {
        const s1 = daySlots[i];
        const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
        const o = s1.open_time ? s1.open_time.substring(0,5) : '';
        const c = s1.close_time ? s1.close_time.substring(0,5) : '';
        if (!timeRegex.test(o) || !timeRegex.test(c)) {
          alert(`Error en ${day.name}: Formato de hora inválido (usa formato HH:mm, ej: 19:30).`);
          return;
        }
        for (let j = i + 1; j < daySlots.length; j++) {
          const s2 = daySlots[j];
          if (s1.open_time === s2.open_time && s1.close_time === s2.close_time) {
            alert(`Error en ${day.name}: Tramos duplicados.`);
            return;
          }
          // overlap logic (simplified, assuming they are sorted, but we can just check bounds)
          if ((s1.open_time <= s2.close_time && s1.close_time >= s2.open_time) && !(s1.close_time < s1.open_time || s2.close_time < s2.open_time)) {
             // this doesn't fully handle cross-midnight overlap, but it's enough for a basic check
             alert(`Error en ${day.name}: Tramos solapados no permitidos.`);
             return;
          }
        }
      }
    }

    setSaving(true);
    
    // Clear all existing and insert the new ones
    await supabase.from('opening_hours').delete().neq('day_of_week', -1);
    
    if (hours.length > 0) {
      // Remove ids to let supabase generate new ones, or keep them if they exist
      const toInsert = hours.filter(h => h.active).map(h => ({
        day_of_week: h.day_of_week,
        open_time: h.open_time,
        close_time: h.close_time,
        active: true
      }));
      
      if (toInsert.length > 0) {
        await supabase.from('opening_hours').insert(toInsert);
      }
    }
    
    // Refresh
    const { data } = await supabase.from('opening_hours').select('*').order('open_time', { ascending: true });
    if (data) setHours(data as OpeningHour[]);
    
    setSaving(false);
    alert('Horarios semanales guardados correctamente');
  };

  const handleAddSlot = (dayId: number) => {
    setHours([...hours, {
      id: crypto.randomUUID(),
      day_of_week: dayId as OpeningHour['day_of_week'],
      open_time: '19:00',
      close_time: '23:30',
      active: true
    }]);
  };

  const handleUpdateSlot = (id: string, field: 'open_time' | 'close_time', value: string) => {
    setHours(hours.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const handleRemoveSlot = (id: string) => {
    setHours(hours.filter(h => h.id !== id));
  };

  const handleToggleDay = (dayId: number, currentClosed: boolean) => {
    if (currentClosed) {
      // Open it by adding a default slot
      handleAddSlot(dayId);
    } else {
      // Close it by removing all slots for this day
      setHours(hours.filter(h => h.day_of_week !== dayId));
    }
  };

  const handleAddSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecial.special_date) return;

    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    const o = newSpecial.open_time ? newSpecial.open_time.substring(0,5) : '';
    const c = newSpecial.close_time ? newSpecial.close_time.substring(0,5) : '';
    
    if (!newSpecial.is_closed && (!timeRegex.test(o) || !timeRegex.test(c))) {
      alert('Error: Formato de hora inválido en la excepción (usa HH:mm, ej: 19:30).');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('special_opening_hours')
      .insert({
        special_date: newSpecial.special_date,
        open_time: newSpecial.open_time || '19:00',
        close_time: newSpecial.close_time || '00:00',
        is_closed: newSpecial.is_closed ?? false,
        notes: newSpecial.notes || null
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setSpecialHours([...specialHours, data as SpecialOpeningHour]);
      setNewSpecial({ special_date: '', open_time: '19:00', close_time: '00:00', is_closed: false, notes: '' });
    } else if (error) {
      alert('Error al añadir excepción: ' + error.message);
    }
  };

  const handleDeleteSpecial = async (id: string) => {
    if (!confirm('¿Eliminar esta excepción de horario?')) return;
    await supabase.from('special_opening_hours').delete().eq('id', id);
    setSpecialHours(specialHours.filter(s => s.id !== id));
  };

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

      <section className="p-6 rounded-2xl border border-neutral-800 space-y-4 bg-neutral-900">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-800 pb-4">
          <h2 className="text-lg font-bold font-mono flex items-center gap-2">
            <Clock size={18} className="text-yellow-500" /> Horario Semanal Regular
          </h2>
          <button
            onClick={handleSaveHours}
            disabled={saving}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-black text-sm bg-yellow-500 hover:bg-yellow-400 transition-all disabled:opacity-50 w-full sm:w-auto"
          >
            <Save size={16} />
            <span>{saving ? 'Guardando...' : 'Guardar Horarios'}</span>
          </button>
        </div>

        <div className="space-y-6">
          {DAYS.map((day) => {
            const daySlots = hours.filter(h => h.day_of_week === day.id && h.active);
            const isClosed = daySlots.length === 0;

            return (
              <div key={day.id} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <h3 className="font-bold text-neutral-200 font-mono uppercase tracking-wider">{day.name}</h3>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-xs text-neutral-400">Cerrado todo el día</span>
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={() => handleToggleDay(day.id, isClosed)}
                      className="w-4 h-4 rounded border-neutral-700 text-red-500 bg-neutral-800"
                    />
                  </label>
                </div>

                {!isClosed && (
                  <div className="space-y-3 pl-2 sm:pl-4">
                    {daySlots.map(slot => (
                      <div key={slot.id} className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-2 bg-neutral-900 p-1.5 rounded-lg border border-neutral-700">
                          <TimeInput
                            value={slot.open_time}
                            onChange={val => handleUpdateSlot(slot.id, 'open_time', val)}
                          />
                          <span className="text-neutral-500 text-xs">a</span>
                          <TimeInput
                            value={slot.close_time}
                            onChange={val => handleUpdateSlot(slot.id, 'close_time', val)}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveSlot(slot.id)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1 text-xs"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddSlot(day.id)}
                      className="text-yellow-500 hover:text-yellow-400 text-xs font-bold flex items-center gap-1 pt-1 uppercase tracking-wider"
                    >
                      <Plus size={14} /> Añadir tramo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Excepciones */}
      <section className="p-6 rounded-2xl border border-neutral-800 space-y-4 bg-neutral-900">
        <h2 className="text-lg font-bold font-mono flex items-center gap-2 border-b border-neutral-800 pb-4">
          <Calendar size={18} className="text-yellow-500" /> Días Especiales y Festivos
        </h2>

        <form onSubmit={handleAddSpecial} className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
          <span className="text-xs font-bold uppercase text-neutral-400">Añadir Excepción</span>
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
              <div className="flex items-center space-x-1 p-1">
                <TimeInput
                  disabled={newSpecial.is_closed}
                  value={newSpecial.open_time || ''}
                  onChange={(val) => setNewSpecial({ ...newSpecial, open_time: val })}
                />
                <span className="text-neutral-500">-</span>
                <TimeInput
                  disabled={newSpecial.is_closed}
                  value={newSpecial.close_time || ''}
                  onChange={(val) => setNewSpecial({ ...newSpecial, close_time: val })}
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
                  className="w-4 h-4 rounded border-neutral-700 text-red-500 bg-neutral-800"
                />
                <span>Cerrado todo el día</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2.5 bg-yellow-500 text-black font-bold rounded-lg text-xs hover:bg-yellow-400 ml-auto"
              >
                Añadir
              </button>
            </div>
          </div>
        </form>

        <div className="space-y-2">
          {specialHours.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-2">No hay excepciones configuradas.</p>
          ) : (
            specialHours.map((special) => (
              <div key={special.id} className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3 font-mono">
                  <span className="font-bold text-yellow-500">{special.special_date}</span>
                  <span>
                    {special.is_closed ? (
                      <span className="text-red-400 font-bold">CERRADO FESTIVO</span>
                    ) : (
                      `${special.open_time.substring(0,5)} - ${special.close_time.substring(0,5)}`
                    )}
                  </span>
                  {special.notes && <span className="text-neutral-400 italic">({special.notes})</span>}
                </div>

                <button
                  onClick={() => handleDeleteSpecial(special.id)}
                  className="p-2 text-red-400 hover:bg-red-950/40 rounded-lg"
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
