'use client';

import { useState } from 'react';
import { User as UserIcon, Edit2, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

import { Profile } from '@/types';

export default function ProfileSectionClient({ 
  profile, 
  email 
}: { 
  profile: Profile | null; 
  email: string 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSave = async () => {
    if (!profile?.id) return;
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      alert('El teléfono no puede estar vacío');
      return;
    }
    
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ phone: cleanPhone })
      .eq('id', profile.id);

    setIsSaving(false);
    
    if (!error) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert('Error al guardar el teléfono');
    }
  };

  return (
    <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(184,135,39,0.15)', color: '#B88727' }}>
          <UserIcon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-xl uppercase mb-1" style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}>
            {profile?.full_name || email}
          </h2>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="px-2 py-1 text-xs font-mono rounded border focus:outline-none"
                  style={{ backgroundColor: '#fff', borderColor: '#D4C4A0', color: '#3A2418' }}
                  placeholder="Tu teléfono"
                  disabled={isSaving}
                />
                <button onClick={handleSave} disabled={isSaving} className="p-1 rounded bg-green-100 text-green-700 hover:bg-green-200">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setIsEditing(false)} disabled={isSaving} className="p-1 rounded bg-red-100 text-red-700 hover:bg-red-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#65513F' }}>
                <span>{profile?.phone || 'Sin teléfono'} | {email}</span>
                <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-[#E8D5A8]/30 text-[#A94F2F] transition-colors" title="Editar teléfono">
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
