'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, X, Megaphone, Copy, Image as ImageIcon, Video } from 'lucide-react';
import type { Product } from '@/types';

interface Campaign {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  media_type: 'IMAGE' | 'VIDEO';
  image_url: string | null;
  video_url: string | null;
  product_id: string | null;
  promo_price: number | null;
  button_text: string;
  button_url: string;
  active: boolean;
  show_modal: boolean;
  show_home: boolean;
  show_menu: boolean;
  start_date: string | null;
  end_date: string | null;
  priority: number;
  display_frequency: 'ONCE_PER_SESSION' | 'ONCE_PER_DAY' | 'ALWAYS';
  created_at: string;
  updated_at: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  
  const [formData, setFormData] = useState<Partial<Campaign>>({
    title: '',
    subtitle: '',
    description: '',
    media_type: 'IMAGE',
    image_url: '',
    video_url: '',
    product_id: '',
    promo_price: null,
    button_text: 'Ver más',
    button_url: '',
    active: true,
    show_modal: false,
    show_home: false,
    show_menu: false,
    start_date: '',
    end_date: '',
    priority: 0,
    display_frequency: 'ONCE_PER_SESSION'
  });

  const supabase = createClient();

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [campaignsRes, productsRes] = await Promise.all([
          supabase.from('campaigns').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false }),
          supabase.from('products').select('*').eq('active', true)
        ]);
        if (!ignore) {
          if (campaignsRes.data) setCampaigns(campaignsRes.data);
          if (productsRes.data) setProducts(productsRes.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void loadData();
    return () => { ignore = true; };
  }, [supabase]);

  const reloadData = async () => {
    const [campaignsRes, productsRes] = await Promise.all([
      supabase.from('campaigns').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('active', true)
    ]);
    if (campaignsRes.data) setCampaigns(campaignsRes.data);
    if (productsRes.data) setProducts(productsRes.data);
  };

  // Format price helper without using external utils
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleOpenModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({
        ...campaign,
        product_id: campaign.product_id || '',
        start_date: campaign.start_date ? new Date(campaign.start_date).toISOString().slice(0, 16) : '',
        end_date: campaign.end_date ? new Date(campaign.end_date).toISOString().slice(0, 16) : ''
      });
    } else {
      setEditingCampaign(null);
      setFormData({
        title: '',
        subtitle: '',
        description: '',
        media_type: 'IMAGE',
        image_url: '',
        video_url: '',
        product_id: '',
        promo_price: null,
        button_text: 'Ver más',
        button_url: '',
        active: true,
        show_modal: false,
        show_home: false,
        show_menu: false,
        start_date: '',
        end_date: '',
        priority: 0,
        display_frequency: 'ONCE_PER_SESSION'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const dataToSave = {
      ...formData,
      product_id: formData.product_id === '' ? null : formData.product_id,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    };

    if (editingCampaign) {
      const { error } = await supabase
        .from('campaigns')
        .update(dataToSave)
        .eq('id', editingCampaign.id);
      if (!error) {
        reloadData();
        setIsModalOpen(false);
      } else {
        console.error('Error updating:', error);
      }
    } else {
      const { error } = await supabase
        .from('campaigns')
        .insert([dataToSave]);
      if (!error) {
        reloadData();
        setIsModalOpen(false);
      } else {
        console.error('Error creating:', error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta campaña?')) {
      await supabase.from('campaigns').delete().eq('id', id);
      reloadData();
    }
  };

  const handleDuplicate = async (campaign: Campaign) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = campaign;
    const duplicatedData = {
      ...rest,
      title: `Copia de ${campaign.title}`
    };
    await supabase.from('campaigns').insert([duplicatedData]);
    reloadData();
  };

  const toggleStatus = async (id: string, field: string, value: boolean) => {
    await supabase.from('campaigns').update({ [field]: value }).eq('id', id);
    reloadData();
  };

  return (
    <div className="p-6 bg-neutral-900 min-h-screen text-neutral-100 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-mono text-yellow-500 flex items-center gap-2">
          <Megaphone className="w-6 h-6" />
          Publicidad y Campañas
        </h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-yellow-500 hover:bg-yellow-600 text-neutral-900 font-bold py-2 px-4 rounded flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </button>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-neutral-500 py-8 text-sm font-medium">Cargando campañas...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center text-neutral-500 py-8 text-sm font-medium">No hay campañas registradas</div>
        ) : (
          campaigns.map((c) => {
            const product = products.find(p => p.id === c.product_id);
            return (
              <div key={c.id} className="bg-neutral-800 border border-neutral-700 rounded-xl p-4 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="font-bold text-white text-lg truncate flex items-center gap-2">
                      {c.media_type === 'IMAGE' ? <ImageIcon className="w-4 h-4 text-neutral-400 shrink-0" /> : <Video className="w-4 h-4 text-neutral-400 shrink-0" />}
                      <span className="truncate">{c.title}</span>
                    </div>
                    <div className="text-sm text-neutral-400 mt-1 truncate">{product?.name || 'Sin Producto'}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-yellow-500 font-bold">{c.promo_price ? formatPrice(c.promo_price) : '-'}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <span onClick={() => toggleStatus(c.id, 'show_modal', !c.show_modal)} className={`text-xs font-bold px-2 py-1 rounded cursor-pointer ${c.show_modal ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Modal</span>
                  <span onClick={() => toggleStatus(c.id, 'show_home', !c.show_home)} className={`text-xs font-bold px-2 py-1 rounded cursor-pointer ${c.show_home ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Home</span>
                  <span onClick={() => toggleStatus(c.id, 'show_menu', !c.show_menu)} className={`text-xs font-bold px-2 py-1 rounded cursor-pointer ${c.show_menu ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Menú</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-700">
                  <button 
                    onClick={() => toggleStatus(c.id, 'active', !c.active)}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-colors text-sm font-bold ${
                      c.active ? 'bg-green-900/30 text-green-500 border border-green-900/50' : 'bg-neutral-700 text-neutral-400'
                    }`}
                  >
                    {c.active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button 
                    onClick={() => handleOpenModal(c)}
                    className="flex items-center justify-center gap-2 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm font-bold"
                  >
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button 
                    onClick={() => handleDuplicate(c)}
                    className="flex items-center justify-center gap-2 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm font-bold col-span-1"
                  >
                    <Copy className="w-4 h-4" /> Duplicar
                  </button>
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="flex items-center justify-center gap-2 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-500 border border-red-900/30 rounded-lg transition-colors text-sm font-bold col-span-1"
                  >
                    <Trash2 className="w-4 h-4" /> Borrar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-neutral-800 rounded-lg border border-neutral-700 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-700 bg-neutral-800 text-neutral-400">
              <th className="p-4 font-mono text-sm">Título</th>
              <th className="p-4 font-mono text-sm">Media</th>
              <th className="p-4 font-mono text-sm">Producto</th>
              <th className="p-4 font-mono text-sm">Precio</th>
              <th className="p-4 font-mono text-sm">Ubicación</th>
              <th className="p-4 font-mono text-sm">Estado</th>
              <th className="p-4 font-mono text-sm text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">Cargando campañas...</td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">No hay campañas registradas</td>
              </tr>
            ) : (
              campaigns.map((c) => {
                const product = products.find(p => p.id === c.product_id);
                return (
                  <tr key={c.id} className="hover:bg-neutral-700/50 transition-colors">
                    <td className="p-4 font-medium text-white">{c.title}</td>
                    <td className="p-4">
                      {c.media_type === 'IMAGE' ? <ImageIcon className="w-5 h-5 text-neutral-400" /> : <Video className="w-5 h-5 text-neutral-400" />}
                    </td>
                    <td className="p-4 text-neutral-300">{product?.name || '-'}</td>
                    <td className="p-4 text-neutral-300">{c.promo_price ? formatPrice(c.promo_price) : '-'}</td>
                    <td className="p-4">
                      <div className="flex gap-2 text-xs">
                        <span onClick={() => toggleStatus(c.id, 'show_modal', !c.show_modal)} className={`cursor-pointer px-2 py-1 rounded font-bold ${c.show_modal ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Modal</span>
                        <span onClick={() => toggleStatus(c.id, 'show_home', !c.show_home)} className={`cursor-pointer px-2 py-1 rounded font-bold ${c.show_home ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Home</span>
                        <span onClick={() => toggleStatus(c.id, 'show_menu', !c.show_menu)} className={`cursor-pointer px-2 py-1 rounded font-bold ${c.show_menu ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Menú</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(c.id, 'active', !c.active)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${c.active ? 'bg-yellow-500' : 'bg-neutral-600'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${c.active ? 'right-1' : 'left-1'}`} />
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleDuplicate(c)} className="p-2 text-neutral-400 hover:text-white transition-colors" title="Duplicar">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenModal(c)} className="p-2 text-neutral-400 hover:text-blue-400 transition-colors" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(c.id)} className="p-2 text-neutral-400 hover:text-red-400 transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
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
                <Megaphone className="w-5 h-5 text-yellow-500" />
                {editingCampaign ? 'EDITAR CAMPAÑA' : 'NUEVA CAMPAÑA'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors p-2 -mr-2">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Contenido Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
                
                {/* Textos Principales */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Datos Principales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Título *</label>
                      <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Subtítulo</label>
                      <input type="text" value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Descripción</label>
                      <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none resize-none" rows={3} />
                    </div>
                  </div>
                </div>

                {/* Multimedia */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Multimedia</h3>
                  <div className="grid grid-cols-1 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Tipo de Media</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-white font-medium cursor-pointer bg-neutral-800/50 border border-neutral-700 p-3 rounded-lg flex-1">
                          <input type="radio" checked={formData.media_type === 'IMAGE'} onChange={() => setFormData({...formData, media_type: 'IMAGE'})} className="accent-yellow-500 w-4 h-4" />
                          Imagen
                        </label>
                        <label className="flex items-center gap-2 text-white font-medium cursor-pointer bg-neutral-800/50 border border-neutral-700 p-3 rounded-lg flex-1">
                          <input type="radio" checked={formData.media_type === 'VIDEO'} onChange={() => setFormData({...formData, media_type: 'VIDEO'})} className="accent-yellow-500 w-4 h-4" />
                          Video
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">
                        {formData.media_type === 'IMAGE' ? 'URL de Imagen' : 'URL de Video'}
                      </label>
                      <input 
                        type="text" 
                        value={formData.media_type === 'IMAGE' ? formData.image_url || '' : formData.video_url || ''} 
                        onChange={e => {
                          if (formData.media_type === 'IMAGE') setFormData({...formData, image_url: e.target.value});
                          else setFormData({...formData, video_url: e.target.value});
                        }} 
                        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none" 
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>

                {/* Enlace y Precio */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Promoción y Enlace</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Enlazar Producto</label>
                      <select value={formData.product_id || ''} onChange={e => setFormData({...formData, product_id: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none">
                        <option value="">Ninguno</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Precio Promocional</label>
                      <input type="number" value={formData.promo_price || ''} onChange={e => setFormData({...formData, promo_price: e.target.value ? parseInt(e.target.value) : null})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Texto del Botón</label>
                      <input type="text" value={formData.button_text} onChange={e => setFormData({...formData, button_text: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-neutral-400 uppercase font-mono font-bold">URL del Botón</label>
                      <input type="text" value={formData.button_url || ''} onChange={e => setFormData({...formData, button_url: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {/* Ubicaciones */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2">Configuración de Visualización</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Frecuencia</label>
                        <select value={formData.display_frequency} onChange={e => setFormData({...formData, display_frequency: e.target.value as Campaign['display_frequency']})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none">
                          <option value="ONCE_PER_SESSION">Una vez por sesión</option>
                          <option value="ONCE_PER_DAY">Una vez al día</option>
                          <option value="ALWAYS">Siempre</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Prioridad (Mayor = Arriba)</label>
                        <input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Fecha Inicio (Opcional)</label>
                        <input type="datetime-local" value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none [color-scheme:dark]" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-neutral-400 uppercase font-mono font-bold">Fecha Fin (Opcional)</label>
                        <input type="datetime-local" value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-base text-white focus:border-yellow-500 focus:outline-none [color-scheme:dark]" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800/50 cursor-pointer min-h-[56px]">
                        <span className="text-white font-bold text-sm">Mostrar como Modal</span>
                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.show_modal ? 'bg-yellow-500' : 'bg-neutral-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.show_modal ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" checked={formData.show_modal} onChange={e => setFormData({...formData, show_modal: e.target.checked})} className="hidden" />
                      </label>

                      <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800/50 cursor-pointer min-h-[56px]">
                        <span className="text-white font-bold text-sm">Mostrar en Inicio (Home)</span>
                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.show_home ? 'bg-yellow-500' : 'bg-neutral-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.show_home ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" checked={formData.show_home} onChange={e => setFormData({...formData, show_home: e.target.checked})} className="hidden" />
                      </label>

                      <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800/50 cursor-pointer min-h-[56px]">
                        <span className="text-white font-bold text-sm">Mostrar en Menú (Lista)</span>
                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.show_menu ? 'bg-yellow-500' : 'bg-neutral-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.show_menu ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" checked={formData.show_menu} onChange={e => setFormData({...formData, show_menu: e.target.checked})} className="hidden" />
                      </label>

                      <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-700 bg-neutral-800/50 cursor-pointer min-h-[56px]">
                        <span className="text-white font-bold text-sm">Campaña Activa</span>
                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.active ? 'bg-yellow-500' : 'bg-neutral-600'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer Sticky */}
              <div className="flex gap-4 p-4 md:p-6 border-t border-neutral-800 bg-neutral-900 shrink-0 md:rounded-b-xl">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 md:flex-none px-6 py-3 rounded-lg font-bold text-neutral-300 bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!formData.title}
                  className="flex-1 md:flex-none px-6 py-3 rounded-lg font-bold bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 transition-colors"
                >
                  Guardar Campaña
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
