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

      <div className="bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
        <div className="overflow-x-auto">
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
                          <span onClick={() => toggleStatus(c.id, 'show_modal', !c.show_modal)} className={`cursor-pointer px-2 py-1 rounded ${c.show_modal ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Modal</span>
                          <span onClick={() => toggleStatus(c.id, 'show_home', !c.show_home)} className={`cursor-pointer px-2 py-1 rounded ${c.show_home ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Home</span>
                          <span onClick={() => toggleStatus(c.id, 'show_menu', !c.show_menu)} className={`cursor-pointer px-2 py-1 rounded ${c.show_menu ? 'bg-yellow-500/20 text-yellow-500' : 'bg-neutral-700 text-neutral-400'}`}>Menú</span>
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto mt-10">
            <div className="sticky top-0 bg-neutral-800 border-b border-neutral-700 p-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-mono text-white">
                {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Título *</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Subtítulo</label>
                  <input type="text" value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Descripción</label>
                <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none h-24" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Tipo de Media</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                      <input type="radio" checked={formData.media_type === 'IMAGE'} onChange={() => setFormData({...formData, media_type: 'IMAGE'})} className="accent-yellow-500" />
                      Imagen
                    </label>
                    <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                      <input type="radio" checked={formData.media_type === 'VIDEO'} onChange={() => setFormData({...formData, media_type: 'VIDEO'})} className="accent-yellow-500" />
                      Video
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">
                    {formData.media_type === 'IMAGE' ? 'URL de Imagen' : 'URL de Video'}
                  </label>
                  {formData.media_type === 'IMAGE' ? (
                    <input type="text" value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none" />
                  ) : (
                    <input type="text" value={formData.video_url || ''} onChange={e => setFormData({...formData, video_url: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Enlazar Producto (Opcional)</label>
                  <select value={formData.product_id || ''} onChange={e => setFormData({...formData, product_id: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none">
                    <option value="">Ninguno</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Precio Promocional</label>
                  <input type="number" value={formData.promo_price || ''} onChange={e => setFormData({...formData, promo_price: e.target.value ? parseInt(e.target.value) : null})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Texto del Botón</label>
                  <input type="text" value={formData.button_text} onChange={e => setFormData({...formData, button_text: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">URL del Botón (Opcional)</label>
                  <input type="text" value={formData.button_url || ''} onChange={e => setFormData({...formData, button_url: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-700 pt-4">
                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                  <input type="checkbox" checked={formData.show_modal} onChange={e => setFormData({...formData, show_modal: e.target.checked})} className="accent-yellow-500 w-4 h-4" />
                  Mostrar como Modal
                </label>
                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                  <input type="checkbox" checked={formData.show_home} onChange={e => setFormData({...formData, show_home: e.target.checked})} className="accent-yellow-500 w-4 h-4" />
                  Mostrar en Home
                </label>
                <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                  <input type="checkbox" checked={formData.show_menu} onChange={e => setFormData({...formData, show_menu: e.target.checked})} className="accent-yellow-500 w-4 h-4" />
                  Mostrar en Menú
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-neutral-700 pt-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Frecuencia</label>
                  <select value={formData.display_frequency} onChange={e => setFormData({...formData, display_frequency: e.target.value as Campaign['display_frequency']})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none">
                    <option value="ONCE_PER_SESSION">Una vez por sesión</option>
                    <option value="ONCE_PER_DAY">Una vez al día</option>
                    <option value="ALWAYS">Siempre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Prioridad (Mayor = Arriba)</label>
                  <input type="number" value={formData.priority} onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Estado</label>
                  <label className="flex items-center gap-2 text-neutral-300 cursor-pointer mt-2">
                    <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="accent-yellow-500 w-4 h-4" />
                    Campaña Activa
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Fecha Inicio (Opcional)</label>
                  <input type="datetime-local" value={formData.start_date || ''} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Fecha Fin (Opcional)</label>
                  <input type="datetime-local" value={formData.end_date || ''} onChange={e => setFormData({...formData, end_date: e.target.value})} className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-white focus:border-yellow-500 outline-none [color-scheme:dark]" />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-neutral-800 border-t border-neutral-700 p-4 flex justify-end gap-2 z-10">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-neutral-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!formData.title} className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 font-bold py-2 px-6 rounded transition-colors">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
