'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import type { Product, Category } from '@/types';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').order('sort_order', { ascending: true }),
        supabase.from('categories').select('*').order('sort_order', { ascending: true })
      ]);
      if (!ignore) {
        if (prodRes.data) setProducts(prodRes.data as Product[]);
        if (catRes.data) setCategories(catRes.data as Category[]);
        setLoading(false);
      }
    }
    void loadData();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  const handleToggle = async (id: string, field: keyof Product, value: boolean) => {
    const { error } = await supabase.from('products').update({ [field]: value }).eq('id', id);
    if (!error) {
      setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  const openModal = (product: Product | null = null) => {
    setEditingProduct(product || {
      name: '',
      slug: '',
      description: '',
      price: 0,
      category_id: categories[0]?.id || '',
      image: null,
      active: true,
      featured: false,
      sold_out: false,
      sort_order: products.length
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct.price) return;

    const slug = editingProduct.slug || editingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const payload = {
      name: editingProduct.name,
      slug,
      description: editingProduct.description || null,
      price: Number(editingProduct.price),
      category_id: editingProduct.category_id || categories[0]?.id,
      image: editingProduct.image || null,
      active: editingProduct.active ?? true,
      featured: editingProduct.featured ?? false,
      sold_out: editingProduct.sold_out ?? false,
      sort_order: editingProduct.sort_order ?? 0,
    };

    if (editingProduct.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      if (!error) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...payload } as Product : p));
        setIsModalOpen(false);
      }
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (!error && data) {
        setProducts([...products, data as Product]);
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'Oswald, sans-serif', color: 'var(--brand-cream)' }}>Productos</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition-all"
          style={{ backgroundColor: 'var(--brand-yellow)', color: 'var(--brand-black)' }}
        >
          <Plus size={20} />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ backgroundColor: '#111111' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                <th className="px-6 py-4 font-medium">Imagen</th>
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Precio</th>
                <th className="px-6 py-4 font-medium">Activo</th>
                <th className="px-6 py-4 font-medium">Agotado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-neutral-500">Cargando productos...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-neutral-500">No hay productos registrados.</td></tr>
              ) : products.map(product => {
                const category = categories.find(c => c.id === product.category_id);
                return (
                  <tr key={product.id} className="hover:bg-neutral-800/40 border-b border-neutral-800 last:border-0 transition-colors">
                    <td className="px-6 py-4">
                      {product.image ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-800">
                          <Image src={product.image} alt={product.name} fill className="object-cover" sizes="48px" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center text-[10px] text-neutral-500 font-bold">Sin foto</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold" style={{ color: 'var(--brand-cream)' }}>
                      {product.name}
                      {product.featured && <span className="ml-2 text-[10px] bg-yellow-900/60 text-yellow-300 px-2 py-0.5 rounded font-mono">DESTACADO</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-400">{category?.name || 'Sin categoría'}</td>
                    <td className="px-6 py-4 font-mono font-bold" style={{ color: 'var(--brand-yellow)' }}>{formatPrice(product.price)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(product.id, 'active', !product.active)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.active ? 'bg-green-900/60 text-green-300' : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {product.active ? 'Sí' : 'No'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggle(product.id, 'sold_out', !product.sold_out)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          product.sold_out ? 'bg-red-900/60 text-red-300' : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {product.sold_out ? 'AGOTADO' : 'Disponible'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => openModal(product)} className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-900/40 text-red-400 rounded-lg">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Oswald, sans-serif' }}>
                {editingProduct.id ? 'Editar Producto' : 'Nuevo Producto'}
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
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Precio (€) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={editingProduct.price ?? ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Categoría *</label>
                  <select
                    value={editingProduct.category_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                    className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">URL de Imagen</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={editingProduct.image || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full p-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center space-x-2 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={editingProduct.active ?? true}
                    onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 text-yellow-500 focus:ring-yellow-500 bg-neutral-800"
                  />
                  <span>Activo</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={editingProduct.featured ?? false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 text-yellow-500 focus:ring-yellow-500 bg-neutral-800"
                  />
                  <span>Destacado</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={editingProduct.sold_out ?? false}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sold_out: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-700 text-yellow-500 focus:ring-yellow-500 bg-neutral-800"
                  />
                  <span>Agotado</span>
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
