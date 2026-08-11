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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setError('Credenciales incorrectas o acceso no autorizado');
        setLoading(false);
        return;
      }

      // Check if user is registered in admin_users
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id, role')
        .eq('user_id', data.user.id)
        .single();

      if (!adminRecord) {
        await supabase.auth.signOut();
        setError('Acceso denegado: Tu usuario no posee permisos de administración');
        setLoading(false);
        return;
      }

      router.push('/administrador');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0A0A0A' }}
    >
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8 text-white">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 
            className="text-3xl font-bold font-mono tracking-wider mb-1"
            style={{ color: 'var(--brand-yellow)' }}
          >
            LA ESQUINA 51
          </h1>
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest">
            Panel de Administración
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-4 bg-red-950/60 border border-red-900 text-red-300 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm"
              placeholder="admin@laesquina51.es"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-black transition-all disabled:opacity-50 mt-2"
            style={{ backgroundColor: 'var(--brand-yellow)', fontFamily: 'Oswald, sans-serif' }}
          >
            {loading ? 'VERIFICANDO...' : 'INICIAR SESIÓN'}
          </button>
        </form>
      </div>
    </div>
  );
}
