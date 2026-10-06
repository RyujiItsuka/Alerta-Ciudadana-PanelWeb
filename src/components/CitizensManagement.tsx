import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle, 
  Ban, 
  Phone, 
  KeyRound
} from 'lucide-react';
import type { CiudadanoItem } from '../types';

interface CitizensManagementProps {
  citizens: CiudadanoItem[];
  onToggleSuspend: (idPersona: number, currentStatus?: string) => void;
  onResetPin: (dni: string) => void;
}

export const CitizensManagement: React.FC<CitizensManagementProps> = ({
  citizens,
  onToggleSuspend,
  onResetPin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = citizens.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.dni.includes(q) ||
      c.nombres.toLowerCase().includes(q) ||
      c.apellidos.toLowerCase().includes(q) ||
      c.telefono.includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header Bar */}
      <div className="responsive-topbar">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Users size={20} color="#f87171" />
            Gestión y Auditoría de Ciudadanos
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Control de cuentas, suspensión por mal uso del botón de pánico y reseteo de seguridad
          </p>
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
          <input
            type="text"
            placeholder="Buscar por DNI, Nombre o Teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>
      </div>

      {/* Tabla de Ciudadanos */}
      <div className="glass-panel table-responsive-wrapper" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>DNI</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ciudadano</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Teléfono Vinculado</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Rol</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Estado de Cuenta</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Acciones Admin</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron ciudadanos con el criterio de búsqueda.
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isSuspended = c.estado_cuenta === 'suspendido';

                return (
                  <tr key={c.id_persona} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 700, color: '#38bdf8' }}>
                      {c.dni}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 600, color: 'white' }}>
                      {c.nombres} {c.apellidos}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={14} color="#10b981" />
                        +51 {c.telefono}
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: c.rol === 'admin' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
                        color: c.rol === 'admin' ? '#f87171' : 'var(--text-muted)',
                      }}>
                        {c.rol}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      {isSuspended ? (
                        <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          ⛔ SUSPENDIDO
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                          ✅ ACTIVO
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onResetPin(c.dni)}
                          title="Enviar código de reseteo de PIN por WhatsApp"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(56,189,248,0.3)',
                            background: 'rgba(56,189,248,0.1)',
                            color: '#38bdf8',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <KeyRound size={13} />
                          Reset PIN
                        </button>

                        <button
                          onClick={() => onToggleSuspend(c.id_persona, c.estado_cuenta)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: isSuspended ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                            background: isSuspended ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                            color: isSuspended ? '#34d399' : '#f87171',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isSuspended ? (
                            <>
                              <CheckCircle size={13} /> Reactivar
                            </>
                          ) : (
                            <>
                              <Ban size={13} /> Suspender
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
