'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';
import type { Category } from '@/types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
      if (!ignore) {
        if (data) setCategories(data as Category[]);
        setLoading(false);
      }
    }
    void loadData();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  const handleToggle = async (id: string, field: keyof Category, value: boolean) => {
    const { error } = await supabase.from('categories').update({ [field]: value }).eq('id', id);
    if (!error) {
      setCategories(categories.map(c => c.id === id ? { ...c, [field]: value } : c));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newCategories = [...categories];
    
    // Swap sort_order
    const tempOrder = newCategories[index].sort_order;
    newCategories[index].sort_order = newCategories[targetIndex].sort_order;
    newCategories[targetIndex].sort_order = tempOrder;

    // Swap in array
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    setCategories(newCategories);

    // Save to DB
    await Promise.all([
      supabase.from('categories').update({ sort_order: newCategories[index].sort_order }).eq('id', newCategories[index].id),
      supabase.from('categories').update({ sort_order: newCategories[targetIndex].sort_order }).eq('id', newCategories[targetIndex].id)
    ]);
  };

  const openModal = (category: Category | null = null) => {
    setEditingCategory(category || {
      name: '', 
      slug: '', 
      description: '', 
      active: true, 
      sort_order: categories.length
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    const slug = editingCategory.slug || editingCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const payload = {
      name: editingCategory.name,
      slug,
      description: editingCategory.description || null,
      active: editingCategory.active ?? true,
      sort_order: editingCategory.sort_order ?? 0,
    };

    if (editingCategory.id) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
      if (!error) {
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...payload } as Category : c));
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase.from('categories').insert(payload).select().single();
      if (!error && data) {
        setCategories([...categories, data as Category]);
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}>Categorías</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition-all"
          style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
        >
          <Plus size={20} />
          <span>Nueva Categoría</span>
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ backgroundColor: '#111111' }}>
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
              <th className="px-6 py-4 font-medium">Orden</th>
              <th className="px-6 py-4 font-medium">Nombre</th>
              <th className="px-6 py-4 font-medium">Slug</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-neutral-500">Cargando categorías...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-neutral-500">No hay categorías registradas.</td></tr>
            ) : (
              categories.map((category, index) => (
                <tr key={category.id} className="hover:bg-neutral-800/40 border-b border-neutral-800 last:border-0 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleReorder(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30 text-neutral-400"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => handleReorder(index, 'down')}
                        disabled={index === categories.length - 1}
                        className="p-1 hover:bg-neutral-800 rounded disabled:opacity-30 text-neutral-400"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <span className="text-xs text-neutral-400 font-mono ml-2">#{category.sort_order}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold" style={{ color: 'var(--brand-cream)' }}>{category.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-neutral-400">{category.slug}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(category.id, 'active', !category.active)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        category.active ? 'bg-green-900/60 text-green-300' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {category.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => openModal(category)} className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(category.id)} className="p-2 hover:bg-red-900/40 text-red-400 rounded-lg">
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

      {/* Modal */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {editingCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Slug (opcional)</label>
                <input
                  type="text"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editingCategory.active ?? true}
                  onChange={(e) => setEditingCategory({ ...editingCategory, active: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 text-yellow-500 focus:ring-yellow-500 bg-neutral-800"
                />
                <label htmlFor="active" className="text-sm font-medium text-neutral-300">Activo</label>
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
