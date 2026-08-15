'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, X, Truck, Phone } from 'lucide-react';
import type { DeliveryDriver } from '@/types';

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Partial<DeliveryDriver> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function fetchDrivers() {
      const { data } = await supabase
        .from('delivery_drivers')
        .select('*')
        .order('name', { ascending: true });
      if (!ignore && data) {
        setDrivers(data as DeliveryDriver[]);
        setLoading(false);
      }
    }
    fetchDrivers();
    return () => { ignore = true; };
  }, [supabase]);

  const reloadDrivers = async () => {
    const { data } = await supabase
      .from('delivery_drivers')
      .select('*')
      .order('name', { ascending: true });
    if (data) {
      setDrivers(data as DeliveryDriver[]);
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from('delivery_drivers').update({ active }).eq('id', id);
    if (!error) {
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, active } : d));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este repartidor?')) return;
    const { error } = await supabase.from('delivery_drivers').delete().eq('id', id);
    if (!error) {
      setDrivers(prev => prev.filter(d => d.id !== id));
    }
  };

  const openModal = (driver: DeliveryDriver | null = null) => {
    setSaveError(null);
    setEditingDriver(driver || {
      name: '',
      phone: '',
      vehicle_type: 'MOTO',
      notes: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver?.name || !editingDriver.phone) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = {
        name: editingDriver.name,
        phone: editingDriver.phone,
        vehicle_type: editingDriver.vehicle_type || 'MOTO',
        notes: editingDriver.notes || null,
        active: editingDriver.active ?? true,
      };

      if (editingDriver.id) {
        const { error } = await supabase.from('delivery_drivers').update(payload).eq('id', editingDriver.id);
        if (error) throw error;
        
        if (editingDriver.auth_email) {
          const { error: rpcError } = await supabase.rpc('link_driver_by_email', { p_driver_id: editingDriver.id, p_email: editingDriver.auth_email });
          if (rpcError) throw rpcError;
        }

        await reloadDrivers();
        setIsModalOpen(false);
      } else {
        const { data, error } = await supabase.from('delivery_drivers').insert(payload).select().single();
        if (error) throw error;
        if (!data) throw new Error("No se devolvió el repartidor creado.");

        if (editingDriver.auth_email) {
          const { error: rpcError } = await supabase.rpc('link_driver_by_email', { p_driver_id: data.id, p_email: editingDriver.auth_email });
          if (rpcError) throw rpcError;
        }

        await reloadDrivers();
        setIsModalOpen(false);
      }
    } catch (err: unknown) {
      console.error("Error saving driver:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError(msg || 'Error al guardar el repartidor. Revisa los datos.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white space-y-8 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-mono" style={{ color: 'var(--brand-cream)' }}>
            Gestión de Repartidores
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Personal de entrega asignable a los pedidos en reparto
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-yellow-500 text-black hover:bg-yellow-400 transition-all"
        >
          <Plus size={18} />
          <span>Alta Repartidor</span>
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Teléfono</th>
                <th className="px-6 py-4 font-medium">Vehículo</th>
                <th className="px-6 py-4 font-medium">Notas</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 text-xs">
                    Cargando repartidores...
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 text-xs">
                    No hay repartidores registrados.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-neutral-800/40 border-b border-neutral-800 last:border-0">
                    <td className="px-6 py-4 font-bold text-neutral-200 text-sm">
                      <div className="flex items-center space-x-2">
                        <Truck size={16} className="text-yellow-500" />
                        <span>{driver.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-neutral-300">
                      <a href={`tel:${driver.phone}`} className="flex items-center space-x-1 hover:underline">
                        <Phone size={14} className="text-neutral-400" />
                        <span>{driver.phone}</span>
                      </a>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold">
                        {driver.vehicle_type || 'MOTO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-neutral-400 max-w-xs truncate">
                      {driver.notes || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(driver.id, !driver.active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          driver.active ? 'bg-green-900/60 text-green-300' : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {driver.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openModal(driver)} className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(driver.id)} className="p-2 hover:bg-red-900/40 text-red-400 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && editingDriver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center sm:p-4 p-0">
          <div className="bg-neutral-900 sm:border border-neutral-800 sm:rounded-2xl w-full sm:w-[94vw] md:max-w-[700px] h-[100dvh] sm:h-auto sm:max-h-[90dvh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-neutral-800 shrink-0 bg-neutral-900">
              <h3 className="text-xl font-bold font-mono">
                {editingDriver.id ? 'Editar Repartidor' : 'Alta de Repartidor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                {saveError && (
                  <div className="p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-sm">
                    {saveError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editingDriver.name || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                    placeholder="Ej: Carlos Gómez"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Email de Cuenta App (Opcional)</label>
                  <input
                    type="email"
                    value={editingDriver.auth_email || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, auth_email: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                    placeholder="Para vincular login"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Teléfono *</label>
                  <input
                    type="tel"
                    required
                    value={editingDriver.phone || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                    placeholder="612345678"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Tipo de Vehículo</label>
                  <select
                    value={editingDriver.vehicle_type || 'MOTO'}
                    onChange={(e) => setEditingDriver({ ...editingDriver, vehicle_type: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                  >
                    <option value="MOTO">Moto / Ciclomotor</option>
                    <option value="BICI">Bicicleta / Patinete</option>
                    <option value="COCHE">Coche</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Notas / Observaciones</label>
                  <textarea
                    rows={2}
                    value={editingDriver.notes || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, notes: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2 pb-4">
                  <input
                    type="checkbox"
                    id="driver_active"
                    checked={editingDriver.active ?? true}
                    onChange={(e) => setEditingDriver({ ...editingDriver, active: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 text-yellow-500 focus:ring-yellow-500 bg-neutral-800"
                  />
                  <label htmlFor="driver_active" className="text-xs font-medium text-neutral-300">Repartidor Activo</label>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-neutral-800 shrink-0 bg-neutral-900 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSaving}
                    className="flex-1 py-3 border border-neutral-700 rounded-xl font-bold text-neutral-300 hover:bg-neutral-800 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-xl font-bold text-black flex items-center justify-center disabled:opacity-50"
                    style={{ backgroundColor: 'var(--brand-yellow)' }}
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
