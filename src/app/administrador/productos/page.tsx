'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, X, UtensilsCrossed } from 'lucide-react';

interface Product {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description?: string | null;
  price: number;
  image: string | null;
  image_url?: string | null;
  video_url?: string | null;
  active: boolean;
  featured: boolean;
  sort_order: number;
  sold_out: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    category_id: '',
    image: '',
    image_url: '',
    video_url: '',
    active: true,
    featured: false,
    sold_out: false,
    sort_order: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      const { data: prodData } = await supabase
        .from('products')
        .select('*, categories(name)')
        .order('sort_order');

      if (!ignore) {
        if (catData) setCategories(catData);
        if (prodData) setProducts(prodData);
        setLoading(false);
      }
    }
    void loadData();
    return () => { ignore = true; };
  }, [supabase]);

  const reloadData = async () => {
    const { data: catData } = await supabase.from('categories').select('*').order('sort_order');
    const { data: prodData } = await supabase.from('products').select('*, categories(name)').order('sort_order');
    if (catData) setCategories(catData);
    if (prodData) setProducts(prodData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'price' || name === 'sort_order') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      if (name === 'name' && !editingProduct) {
        setFormData(prev => ({
          ...prev,
          name: value,
          slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        }));
      }
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ active: !current }).eq('id', id);
    reloadData();
  };

  const handleToggleSoldOut = async (id: string, current: boolean) => {
    await supabase.from('products').update({ sold_out: !current }).eq('id', id);
    reloadData();
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        short_description: product.short_description || '',
        price: product.price || 0,
        category_id: product.category_id || (categories.length > 0 ? categories[0].id : ''),
        image: product.image || '',
        image_url: product.image_url || '',
        video_url: product.video_url || '',
        active: product.active ?? true,
        featured: product.featured ?? false,
        sold_out: product.sold_out ?? false,
        sort_order: product.sort_order || 0,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        short_description: '',
        price: 0,
        category_id: categories.length > 0 ? categories[0].id : '',
        image: '',
        image_url: '',
        video_url: '',
        active: true,
        featured: false,
        sold_out: false,
        sort_order: 0,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalSlug = formData.slug;
    if (!finalSlug) {
      finalSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const payload = {
      ...formData,
      slug: finalSlug,
    };

    if (editingProduct) {
      await supabase.from('products').update(payload).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([payload]);
    }
    
    closeModal();
    reloadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      await supabase.from('products').delete().eq('id', id);
      reloadData();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(price);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-mono text-yellow-500 flex items-center gap-3" style={{ fontFamily: 'Oswald, sans-serif' }}>
          <UtensilsCrossed className="w-8 h-8" />
          GESTIÓN DE PRODUCTOS
        </h1>
        <button
          onClick={() => openModal()}
          className="bg-yellow-500 hover:bg-yellow-600 text-neutral-900 px-4 py-2 rounded font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-800 text-neutral-100 uppercase font-mono">
            <tr>
              <th className="px-6 py-4">Imagen</th>
              <th className="px-6 py-4">Nombre</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Precio</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                  Cargando productos...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-6 py-4">
                    {product.image || product.image_url ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden border border-neutral-700 bg-neutral-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={product.image || product.image_url || ''} 
                          alt={product.name}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded bg-neutral-800 flex items-center justify-center border border-neutral-700">
                        <UtensilsCrossed className="w-5 h-5 text-neutral-600" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-white mb-1 flex items-center gap-2">
                      {product.name}
                      {product.featured && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded uppercase font-bold border border-yellow-500/30">
                          Destacado
                        </span>
                      )}
                      {product.sold_out && (
                        <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded uppercase font-bold border border-red-500/30">
                          Agotado
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 truncate max-w-xs" title={product.slug}>
                      {product.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-neutral-800 px-2 py-1 rounded text-xs">
                      {product.categories?.name || 'Sin Categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-yellow-500">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input 
                          type="checkbox" 
                          checked={product.active}
                          onChange={() => handleToggleActive(product.id, product.active)}
                          className="rounded bg-neutral-800 border-neutral-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900"
                        />
                        <span>{product.active ? 'Activo' : 'Inactivo'}</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs">
                        <input 
                          type="checkbox" 
                          checked={product.sold_out}
                          onChange={() => handleToggleSoldOut(product.id, product.sold_out)}
                          className="rounded bg-neutral-800 border-neutral-700 text-red-500 focus:ring-red-500 focus:ring-offset-neutral-900"
                        />
                        <span className={product.sold_out ? 'text-red-400' : ''}>Agotado</span>
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(product)}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-3xl my-8 relative shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-neutral-800 sticky top-0 bg-neutral-900 z-10 rounded-t-lg">
              <h2 className="text-xl font-mono text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-yellow-500" />
                {editingProduct ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Basic Info */}
                <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-400 uppercase font-mono">Nombre *</label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-400 uppercase font-mono">Slug</label>
                    <input 
                      type="text" 
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="Auto-generado si está vacío"
                      className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-neutral-400 uppercase font-mono">Descripción Corta</label>
                  <input 
                    type="text" 
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm text-neutral-400 uppercase font-mono">Descripción Detallada</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 uppercase font-mono">Precio (USD) *</label>
                  <input 
                    type="number" 
                    name="price"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none font-mono text-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 uppercase font-mono">Categoría *</label>
                  <select 
                    name="category_id"
                    required
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
                  >
                    <option value="" disabled>Seleccione una categoría</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 uppercase font-mono">URL Imagen</label>
                  <input 
                    type="url" 
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 uppercase font-mono">URL Imagen Alternativa</label>
                  <input 
                    type="url" 
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 uppercase font-mono">URL Video</label>
                  <input 
                    type="url" 
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    placeholder="https://..."
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 uppercase font-mono">Orden de Visualización</label>
                  <input 
                    type="number" 
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 focus:outline-none"
                  />
                </div>

                {/* Flags */}
                <div className="space-y-4 md:col-span-2 bg-neutral-800/50 p-4 rounded border border-neutral-800 flex flex-wrap gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded bg-neutral-800 border-neutral-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900"
                    />
                    <span className="text-white font-medium">Producto Activo (Visible)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded bg-neutral-800 border-neutral-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-neutral-900"
                    />
                    <span className="text-white font-medium">Destacado</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="sold_out"
                      checked={formData.sold_out}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded bg-neutral-800 border-neutral-700 text-red-500 focus:ring-red-500 focus:ring-offset-neutral-900"
                    />
                    <span className="text-white font-medium">Agotado</span>
                  </label>
                </div>

              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-neutral-800">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 rounded font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded font-bold bg-yellow-500 hover:bg-yellow-600 text-neutral-900 transition-colors"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
