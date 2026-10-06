import React, { useState } from 'react';
import { 
  BellRing, 
  Send, 
  CheckCircle2
} from 'lucide-react';

export const CommunityBroadcast: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgente'>('normal');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setTitle('');
      setMessage('');
    }, 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', maxWidth: '800px' }}>
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'rgba(18, 24, 38, 0.7)',
        border: '1px solid var(--border-color)',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellRing size={20} />
          Difusión y Avisos Comunitarios de Emergencia
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Envío de comunicados oficiales de Serenazgo y Seguridad Ciudadana a las apps móviles
        </p>
      </div>

      {sentSuccess && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '8px',
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.4)',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 700,
        }}>
          <CheckCircle2 size={18} />
          Comunicado difundido exitosamente a todos los ciudadanos registrados.
        </div>
      )}

      <form onSubmit={handleSend} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>
            Nivel de Prioridad del Aviso
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setPriority('normal')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: priority === 'normal' ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                background: priority === 'normal' ? 'rgba(59,130,246,0.2)' : 'rgba(0,0,0,0.3)',
                color: priority === 'normal' ? '#93c5fd' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              ℹ️ Informativo / Preventivo
            </button>
            <button
              type="button"
              onClick={() => setPriority('urgente')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: priority === 'urgente' ? '1px solid #ef4444' : '1px solid var(--border-color)',
                background: priority === 'urgente' ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.3)',
                color: priority === 'urgente' ? '#fca5a5' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              🚨 Alerta de Urgencia (Sirena)
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>
            Título del Comunicado
          </label>
          <input
            type="text"
            placeholder="Ej: Operativo nocturno en Av. San Martín / Desvío de vías"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '6px' }}>
            Mensaje Detallado
          </label>
          <textarea
            rows={4}
            placeholder="Detalla las instrucciones de seguridad para la población..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            marginTop: '8px',
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: priority === 'urgente' ? '#dc2626' : '#2563eb',
            color: 'white',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Send size={16} />
          Emitir Difusión a Todas las Apps Móviles
        </button>
      </form>
    </div>
  );
};
