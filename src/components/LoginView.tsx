import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { UserSession } from '../types';

interface LoginModalProps {
  onLogin: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [dniOrUser, setDniOrUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = dniOrUser.trim();
    const cleanPass = password.trim();

    if (!cleanInput || !cleanPass) {
      setError('Por favor ingrese su usuario y contraseña');
      return;
    }

    setLoading(true);

    try {
      // Autenticación 100% en el servidor (Edge Function `security`).
      // El navegador NUNCA compara contraseñas ni lee hashes: bcrypt se ejecuta
      // con service_role en Supabase y solo se devuelve la sesión ya validada.
      const { data, error: fnError } = await supabase.functions.invoke('security', {
        body: {
          action: 'login-staff',
          usuario: cleanInput,
          password: cleanPass,
        },
      });

      if (fnError) {
        // Extraer el mensaje real del cuerpo de la respuesta (401/403 -> error).
        let message = 'Usuario o contraseña incorrectos.';
        try {
          const ctx = (fnError as { context?: Response }).context;
          if (ctx && typeof ctx.json === 'function') {
            const payload = await ctx.json();
            if (payload?.error) message = payload.error;
          }
        } catch {
          // Sin cuerpo parseable: se mantiene el mensaje genérico.
        }
        setError(message);
        return;
      }

      if (!data?.success || !data?.session) {
        setError(data?.error || 'Usuario o contraseña incorrectos.');
        return;
      }

      onLogin({ ...(data.session as UserSession), token: data.token });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error de conexión';
      setError(`Error de autenticación: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-panel login-card" style={{ maxWidth: '420px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            padding: '16px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(59,130,246,0.2) 100%)',
            border: '1px solid rgba(255,255,255,0.12)',
            marginBottom: '16px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          }}>
            <Shield size={40} color="#ef4444" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', color: 'white' }}>
            Central Alerta Ciudadana
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
            Acceso Autorizado al Sistema de Seguridad
          </p>
        </div>

        {/* Formulario Unificado sin selector de rol */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
              Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Ingrese su usuario"
                value={dniOrUser}
                onChange={(e) => setDniOrUser(e.target.value)}
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 42px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 42px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(0,0,0,0.4)',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
              />
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            </div>
          </div>

          {error && (
            <div style={{
              color: '#f87171',
              fontSize: '12px',
              textAlign: 'center',
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.12)',
              borderRadius: '8px',
              border: '1px solid rgba(239,68,68,0.25)',
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '14px',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 10px 25px -5px rgba(239,68,68,0.5)',
              transition: 'opacity 0.2s, transform 0.1s',
            }}
          >
            {loading ? 'Verificando credenciales...' : 'Ingresar al Panel'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
