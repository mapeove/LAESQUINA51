'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, X, Flame } from 'lucide-react';
import type { Promotion, Product } from '@/types';
import { formatPrice } from '@/lib/utils';

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const [promoRes, prodRes] = await Promise.all([
        supabase.from('promotions').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('active', true).order('name', { ascending: true })
      ]);

      if (!ignore) {
        if (promoRes.data) setPromotions(promoRes.data as Promotion[]);
        if (prodRes.data) setProducts(prodRes.data as Product[]);
        setLoading(false);
      }
    }

    void loadData();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  const handleToggle = async (id: string, field: keyof Promotion, value: boolean) => {
    const { error } = await supabase.from('promotions').update({ [field]: value }).eq('id', id);
    if (!error) {
      setPromotions(promotions.map(p => p.id === id ? { ...p, [field]: value } : p));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta promoción?')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (!error) {
      setPromotions(promotions.filter(p => p.id !== id));
    }
  };

  const openModal = (promo: Promotion | null = null) => {
    setEditingPromo(promo || {
      title: '',
      subtitle: '',
      product_id: products[0]?.id || null,
      image_url: '',
      promo_price: 10.50,
      active: true,
      show_modal: true,
      show_home: true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo?.title) return;

    const payload = {
      title: editingPromo.title,
      subtitle: editingPromo.subtitle || null,
      product_id: editingPromo.product_id || null,
      image_url: editingPromo.image_url || null,
      promo_price: editingPromo.promo_price ? Number(editingPromo.promo_price) : null,
      active: editingPromo.active ?? true,
      show_modal: editingPromo.show_modal ?? true,
      show_home: editingPromo.show_home ?? true,
      start_date: editingPromo.start_date || null,
      end_date: editingPromo.end_date || null
    };

    if (editingPromo.id) {
      const { error } = await supabase.from('promotions').update(payload).eq('id', editingPromo.id);
      if (!error) {
        setPromotions(promotions.map(p => p.id === editingPromo.id ? { ...p, ...payload } as Promotion : p));
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase.from('promotions').insert(payload).select().single();
      if (!error && data) {
        setPromotions([data as Promotion, ...promotions]);
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white space-y-8 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-mono" style={{ color: 'var(--brand-cream)' }}>
            Gestión de Promociones
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Configura el modal inicial y ofertas destacadas de La Esquina 51
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-yellow-500 text-black hover:bg-yellow-400 transition-all"
        >
          <Plus size={18} />
          <span>Nueva Promoción</span>
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 overflow-hidden bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <th className="px-6 py-4 font-medium">Promoción</th>
                <th className="px-6 py-4 font-medium">Precio Promo</th>
                <th className="px-6 py-4 font-medium">Modal Inicial</th>
                <th className="px-6 py-4 font-medium">Home</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 text-xs">
                    Cargando promociones...
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 text-xs">
                    No hay promociones registradas.
                  </td>
                </tr>
              ) : (
                promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-neutral-800/40 border-b border-neutral-800 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Flame className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-sm text-neutral-200">{promo.title}</p>
                          {promo.subtitle && <p className="text-xs text-neutral-400">{promo.subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-yellow-500">
                      {promo.promo_price ? formatPrice(promo.promo_price) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(promo.id, 'show_modal', !promo.show_modal)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          promo.show_modal ? 'bg-yellow-900/60 text-yellow-300' : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {promo.show_modal ? 'SI' : 'NO'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(promo.id, 'show_home', !promo.show_home)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          promo.show_home ? 'bg-blue-900/60 text-blue-300' : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {promo.show_home ? 'SI' : 'NO'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(promo.id, 'active', !promo.active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          promo.active ? 'bg-green-900/60 text-green-300' : 'bg-neutral-800 text-neutral-500'
                        }`}
                      >
                        {promo.active ? 'Activa' : 'Inactiva'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openModal(promo)} className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(promo.id)} className="p-2 hover:bg-red-900/40 text-red-400 rounded-lg">
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

      {/* Modal Edit/Create */}
      {isModalOpen && editingPromo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-mono">
                {editingPromo.id ? 'Editar Promoción' : 'Nueva Promoción'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Título Promocional *</label>
                <input
                  type="text"
                  required
                  value={editingPromo.title || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                  placeholder="🔥 EL BOX QUE ESTÁ ROMPIENDO LA ESQUINA"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Subtítulo / Detalles</label>
                <input
                  type="text"
                  value={editingPromo.subtitle || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, subtitle: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                  placeholder="5 MINI BURGERS + PATATAS + SALSAS + COCA-COLA"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Precio Promocional (€)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={editingPromo.promo_price ?? ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, promo_price: parseFloat(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Producto Vinculado</label>
                  <select
                    value={editingPromo.product_id || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, product_id: e.target.value || null })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                  >
                    <option value="">Sin vincular</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatPrice(p.price)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">URL Fotografía Promocional</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editingPromo.image_url || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, image_url: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center space-x-2 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={editingPromo.active ?? true}
                    onChange={(e) => setEditingPromo({ ...editingPromo, active: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 text-yellow-500 focus:ring-yellow-500 bg-neutral-800"
                  />
                  <span>Activa</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={editingPromo.show_modal ?? true}
                    onChange={(e) => setEditingPromo({ ...editingPromo, show_modal: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 text-yellow-500 focus:ring-yellow-500 bg-neutral-800"
                  />
                  <span>Mostrar Modal</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={editingPromo.show_home ?? true}
                    onChange={(e) => setEditingPromo({ ...editingPromo, show_home: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 text-yellow-500 focus:ring-yellow-500 bg-neutral-800"
                  />
                  <span>Mostrar en Home</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-neutral-700 rounded-xl font-bold text-neutral-300 hover:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-black"
                  style={{ backgroundColor: 'var(--brand-yellow)' }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
