'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('Credenciales incorrectas o usuario no encontrado.');
      setLoading(false);
      return;
    }

    router.push('/mi-cuenta');
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md min-h-[70vh] flex flex-col justify-center">
      <h1 className="text-4xl font-bold tracking-wide mb-8 uppercase text-center" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
        INICIAR SESIÓN
      </h1>

      <div className="p-8 rounded-2xl border shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-3 text-sm rounded bg-red-100 text-red-800 border border-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded border text-sm outline-none transition-colors"
              style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8', color: '#3A2418' }}
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>Contraseña</label>
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

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold uppercase text-sm transition-colors shadow-sm disabled:opacity-50"
            style={{ backgroundColor: '#A94F2F', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-mono" style={{ color: '#65513F' }}>
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="font-bold underline" style={{ color: '#A94F2F' }}>
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
