'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Upsert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: fullName,
          phone: phone,
        });
        
      if (profileError) {
        console.error('Error creating profile', profileError);
      }

      // Disparar correo de bienvenida por SMTP
      try {
        await fetch('/api/auth/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName }),
        });
      } catch (err) {
        console.warn('Error al disparar email de bienvenida:', err);
      }
    }

    // Auto-login (Supabase does this automatically in some configs, but we can just redirect)
    router.push('/mi-cuenta');
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md min-h-[70vh] flex flex-col justify-center">
      <h1 className="text-4xl font-bold tracking-wide mb-8 uppercase text-center" style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#3A2418' }}>
        CREAR CUENTA
      </h1>

      <div className="p-8 rounded-2xl border shadow-sm" style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}>
        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="p-3 text-sm rounded bg-red-100 text-red-800 border border-red-200">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>Nombre Completo</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full p-3 rounded border text-sm outline-none transition-colors"
              style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8', color: '#3A2418' }}
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-2" style={{ color: '#3A2418', fontFamily: 'Oswald, sans-serif' }}>Teléfono</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full p-3 rounded border text-sm outline-none transition-colors"
              style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8', color: '#3A2418' }}
              placeholder="Tu número móvil"
            />
          </div>

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
              minLength={6}
              className="w-full p-3 rounded border text-sm outline-none transition-colors"
              style={{ backgroundColor: '#F3E8CC', borderColor: '#E8D5A8', color: '#3A2418' }}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold uppercase text-sm transition-colors shadow-sm disabled:opacity-50"
            style={{ backgroundColor: '#B88727', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-mono" style={{ color: '#65513F' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="font-bold underline" style={{ color: '#A94F2F' }}>
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
