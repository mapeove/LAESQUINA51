'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        setLoading(false);
        return;
      }

      // Check admin_users table for OWNER role + active
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id, role, active')
        .eq('user_id', data.user.id)
        .single();

      if (!adminRecord || !adminRecord.active) {
        await supabase.auth.signOut();
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
        setLoading(false);
        return;
      }

      router.push('/administrador');
      router.refresh();
    } catch {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#F3E8CC' }}
    >
      <div className="w-full max-w-sm rounded-2xl shadow-2xl p-8" style={{ backgroundColor: '#FFF7E5', border: '1px solid #E8D5A8' }}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(184,135,39,0.15)', border: '1px solid rgba(184,135,39,0.3)' }}>
            <ShieldCheck className="w-6 h-6" style={{ color: '#B88727' }} />
          </div>
          <h1 
            className="text-3xl font-bold tracking-wider mb-1"
            style={{ fontFamily: 'Oswald, sans-serif', color: '#3A2418' }}
          >
            LA ESQUINA 51
          </h1>
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#65513F' }}>
            Panel de Administración
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl text-xs font-medium" style={{ backgroundColor: 'rgba(169,79,47,0.1)', border: '1px solid rgba(169,79,47,0.3)', color: '#A94F2F' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#65513F' }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
              placeholder="admin@laesquina51.es"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#65513F' }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
              style={{ backgroundColor: '#F3E8CC', border: '1px solid #D4C4A0', color: '#3A2418' }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 mt-2"
            style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif', letterSpacing: '0.05em' }}
          >
            {loading ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>
      </div>
    </div>
  );
}
