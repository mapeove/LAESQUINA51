'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, X, UtensilsCrossed } from 'lucide-react';
import { MediaUpload } from './MediaUpload';

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
  secondary_image_url?: string | null;
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
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    category_id: '',
    image: '',
    image_url: '',
    secondary_image_url: '',
    video_url: '',
    active: true,
    featured: false,
    sold_out: false,
    sort_order: 0,
  });

  const [newlyUploadedFiles, setNewlyUploadedFiles] = useState<string[]>([]);
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
        secondary_image_url: product.secondary_image_url || '',
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
        secondary_image_url: '',
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
    setSaveError(null);
  };

  const handleCancel = async () => {
    if (newlyUploadedFiles.length > 0) {
      try {
        const filePaths = newlyUploadedFiles.map(url => {
          const parts = url.split('/');
          return parts.slice(parts.indexOf('product-media') + 1).join('/');
        }).filter(path => path);
        
        if (filePaths.length > 0) {
          await supabase.storage.from('product-media').remove(filePaths);
        }
      } catch (err) {
        console.error("Error cleaning up files:", err);
      }
      setNewlyUploadedFiles([]);
    }
    closeModal();
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingMedia) {
      setSaveError("Espera a que terminen de subir los archivos multimedia.");
      return;
    }
    
    setSaveError(null);
    setIsSaving(true);
    
    let finalSlug = formData.slug;
    if (!finalSlug) {
      finalSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const payload = {
      ...formData,
      slug: finalSlug,
      sort_order: Number(formData.sort_order) || 0,
      price: Number(formData.price) || 0
    };

    try {
      let res;
      if (editingProduct) {
        res = await supabase.from('products').update(payload).eq('id', editingProduct.id);
      } else {
        res = await supabase.from('products').insert([payload]);
      }
      
      if (res.error) {
        console.error("Supabase Error:", res.error);
        setSaveError(res.error.message || "Error al guardar en la base de datos.");
        setIsSaving(false);
        return;
      }
      
      setNewlyUploadedFiles([]);
      closeModal();
      reloadData();
    } catch (err: unknown) {
      console.error("Unexpected Error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado al guardar.';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
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

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-neutral-500 py-8 font-medium">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="text-center text-neutral-500 py-8 font-medium">No hay productos registrados.</div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-lg flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="shrink-0">
                  {product.image || product.image_url ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={product.image || product.image_url || ''} 
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-neutral-800 flex items-center justify-center border border-neutral-700">
                      <UtensilsCrossed className="w-8 h-8 text-neutral-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="font-bold text-white text-lg truncate">{product.name}</div>
                  <div className="font-mono text-yellow-500 font-bold">{formatPrice(product.price)}</div>
                  <div className="text-xs text-neutral-400 mt-1 truncate">{product.categories?.name || 'Sin Categoría'}</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {product.featured && (
                  <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded uppercase font-bold border border-yellow-500/30">
                    Destacado
                  </span>
                )}
                {product.sold_out && (
                  <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-1 rounded uppercase font-bold border border-red-500/30">
                    Agotado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800">
                <button 
                  onClick={() => openModal(product)}
                  className="flex items-center justify-center gap-2 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm font-bold"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="flex items-center justify-center gap-2 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-500 border border-red-900/30 rounded-lg transition-colors text-sm font-bold"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto shadow-xl">
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
        <div className="fixed inset-0 z-50 flex flex-col md:p-4 md:bg-black/80 md:items-center md:justify-center">
          <div className="bg-neutral-900 w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-3xl md:rounded-xl flex flex-col relative shadow-2xl">
            {/* Header Sticky */}
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-neutral-800 bg-neutral-900 z-10 shrink-0 md:rounded-t-xl">
              <h2 className="text-lg md:text-xl font-mono text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-yellow-500" />
                {editingProduct ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
              </h2>
              <button 
                type="button"
                onClick={handleCancel}
                className="text-neutral-400 hover:text-white transition-colors p-2 -mr-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Contenido Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
                
                {/* SECCIÓN: DATOS DEL PRODUCTO */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Datos del Producto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Nombre *</label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Slug</label>
                      <input 
                        type="text" 
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="Auto-generado"
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Descripción Corta</label>
                      <input 
                        type="text" 
                        name="short_description"
                        value={formData.short_description}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Descripción Detallada</label>
                      <textarea 
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Precio (€) *</label>
                      <input 
                        type="number" 
                        name="price"
                        required
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none font-mono text-yellow-500 font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Categoría *</label>
                      <select 
                        name="category_id"
                        required
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none"
                      >
                        <option value="" disabled>Seleccione categoría</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN: MULTIMEDIA */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Multimedia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <MediaUpload
                      label="Imagen Principal"
                      type="image"
                      currentUrl={formData.image_url || formData.image || ''}
                      onUploadSuccess={(url) => {
                        setFormData(prev => ({ ...prev, image_url: url }));
                        setNewlyUploadedFiles(prev => [...prev, url]);
                      }}
                      onRemove={() => setFormData(prev => ({ ...prev, image_url: '', image: '' }))}
                      isUploading={isUploadingMedia}
                      setIsUploading={setIsUploadingMedia}
                    />

                    <MediaUpload
                      label="Imagen Secundaria"
                      type="image"
                      currentUrl={formData.secondary_image_url || ''}
                      onUploadSuccess={(url) => {
                        setFormData(prev => ({ ...prev, secondary_image_url: url }));
                        setNewlyUploadedFiles(prev => [...prev, url]);
                      }}
                      onRemove={() => setFormData(prev => ({ ...prev, secondary_image_url: '' }))}
                      isUploading={isUploadingMedia}
                      setIsUploading={setIsUploadingMedia}
                    />

                    <div className="md:col-span-2">
                      <MediaUpload
                        label="Video del Producto"
                        type="video"
                        currentUrl={formData.video_url || ''}
                        onUploadSuccess={(url) => {
                          setFormData(prev => ({ ...prev, video_url: url }));
                          setNewlyUploadedFiles(prev => [...prev, url]);
                        }}
                        onRemove={() => setFormData(prev => ({ ...prev, video_url: '' }))}
                        isUploading={isUploadingMedia}
                        setIsUploading={setIsUploadingMedia}
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN: VISIBILIDAD Y ESTADO */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Visibilidad y Estado</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5 md:w-1/2">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Orden de Visualización</label>
                      <input 
                        type="number" 
                        name="sort_order"
                        value={formData.sort_order}
                        onChange={handleInputChange}
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800/50 cursor-pointer min-h-[56px]">
                        <span className="text-white font-bold text-sm">Producto Activo (Visible)</span>
                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.active ? 'bg-yellow-500' : 'bg-neutral-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" name="active" checked={formData.active} onChange={handleInputChange} className="hidden" />
                      </label>

                      <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800/50 cursor-pointer min-h-[56px]">
                        <span className="text-white font-bold text-sm">Destacado</span>
                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.featured ? 'bg-yellow-500' : 'bg-neutral-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.featured ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" name="featured" checked={formData.featured} onChange={handleInputChange} className="hidden" />
                      </label>

                      <label className="flex items-center justify-between p-4 rounded-xl border border-red-900/30 bg-red-950/10 cursor-pointer min-h-[56px]">
                        <span className="text-red-400 font-bold text-sm">Producto Agotado</span>
                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.sold_out ? 'bg-red-500' : 'bg-neutral-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.sold_out ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" name="sold_out" checked={formData.sold_out} onChange={handleInputChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Sticky */}
              <div className="flex flex-col gap-4 p-4 md:p-6 border-t border-neutral-800 bg-neutral-900 shrink-0 md:rounded-b-xl">
                {saveError && (
                  <div className="bg-red-950/50 border border-red-900/50 text-red-400 p-3 rounded-lg text-sm font-medium">
                    {saveError}
                  </div>
                )}
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 md:flex-none px-6 py-3 rounded-lg font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isUploadingMedia || isSaving}
                    className="flex-1 md:flex-none px-6 py-3 rounded-lg font-bold bg-yellow-500 hover:bg-yellow-600 text-neutral-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingMedia ? 'Subiendo...' : isSaving ? 'Guardando...' : 'Guardar Producto'}
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
