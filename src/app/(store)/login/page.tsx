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
  
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleRecovery = async () => {
    if (!recoveryEmail) {
      setError('Introduce tu email para recuperar la contraseña.');
      return;
    }
    setRecoveryLoading(true);
    setError(null);
    setRecoveryMessage(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
      redirectTo: 'https://www.laesquina51.es/restablecer-contrasena',
    });

    if (resetError) {
      setError('Hubo un error al procesar tu solicitud.');
    } else {
      setRecoveryMessage('Si la cuenta existe, recibirás un correo con las instrucciones.');
    }
    setRecoveryLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError('Credenciales incorrectas o usuario no encontrado.');
      setLoading(false);
      return;
    }

    // Check if the user is an active OWNER
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('role', 'OWNER')
      .maybeSingle();

    if (adminUser) {
      router.replace('/administrador');
      router.refresh();
      return;
    } 
    
    // Check if the user is a driver
    const { data: driverUser } = await supabase
      .from('delivery_drivers')
      .select('*')
      .eq('user_id', data.user.id)
      .eq('active', true)
      .maybeSingle();

    if (driverUser) {
      router.push('/repartidor');
    } else {
      router.push('/mi-cuenta');
    }
    
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
            disabled={loading || showRecovery}
            className="w-full py-4 rounded-xl font-bold uppercase text-sm transition-colors shadow-sm disabled:opacity-50"
            style={{ backgroundColor: '#A94F2F', color: '#FFF7E5', fontFamily: 'Oswald, sans-serif' }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {!showRecovery ? (
          <div className="mt-4 text-center">
            <button 
              onClick={() => setShowRecovery(true)}
              className="text-xs uppercase font-bold underline"
              style={{ color: '#A94F2F' }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-lg border text-center" style={{ backgroundColor: '#F3E8CC', borderColor: '#D4C4A0' }}>
            <h3 className="text-sm font-bold uppercase mb-2" style={{ color: '#3A2418' }}>Recuperar Contraseña</h3>
            <p className="text-xs mb-3" style={{ color: '#65513F' }}>Enviaremos un enlace de recuperación a tu correo.</p>
            {recoveryMessage && (
              <div className="p-2 mb-3 text-xs rounded bg-green-100 text-green-800 border border-green-200">
                {recoveryMessage}
              </div>
            )}
            <input 
              type="email" 
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              className="w-full p-2 mb-3 rounded border text-xs outline-none"
              placeholder="tu@email.com"
              style={{ backgroundColor: '#FFF7E5', borderColor: '#E8D5A8' }}
            />
            <div className="flex gap-2">
              <button 
                onClick={handleRecovery}
                disabled={recoveryLoading}
                className="flex-1 py-2 rounded text-xs font-bold uppercase disabled:opacity-50"
                style={{ backgroundColor: '#B88727', color: '#FFF7E5' }}
              >
                {recoveryLoading ? 'Enviando...' : 'Enviar Enlace'}
              </button>
              <button 
                onClick={() => { setShowRecovery(false); setRecoveryMessage(null); }}
                className="flex-1 py-2 rounded border text-xs font-bold uppercase"
                style={{ backgroundColor: '#FFF7E5', borderColor: '#D4C4A0', color: '#3A2418' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

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
