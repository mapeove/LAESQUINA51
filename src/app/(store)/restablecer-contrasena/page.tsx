'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError('Error al actualizar la contraseña. Es posible que el enlace haya expirado.');
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md min-h-[70vh] flex flex-col justify-center">
      <h1 className="text-4xl font-bold tracking-wide mb-8 uppercase text-center" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
        RESTABLECER CONTRASEÑA
      </h1>

      <div className="p-8 rounded-2xl border shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
        {success ? (
          <div className="text-center">
            <div className="p-4 mb-6 rounded bg-green-100 text-green-800 border border-green-200 font-bold uppercase">
              Contraseña actualizada correctamente
            </div>
            <Link 
              href="/login"
              className="inline-block w-full py-4 rounded-xl font-bold uppercase text-sm transition-colors shadow-sm"
              style={{ backgroundColor: '#A94F2F', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
            >
              Volver a Iniciar Sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            {error && (
              <div className="p-3 text-sm rounded bg-red-100 text-red-800 border border-red-200">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>NUEVA CONTRASEÑA</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 rounded border text-sm outline-none transition-colors"
                style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8', color: '#3A2418' }}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>CONFIRMAR CONTRASEÑA</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 rounded border text-sm outline-none transition-colors"
                style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8', color: '#3A2418' }}
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold uppercase text-sm transition-colors shadow-sm disabled:opacity-50"
              style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
            >
              {loading ? 'Guardando...' : 'GUARDAR NUEVA CONTRASEÑA'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
