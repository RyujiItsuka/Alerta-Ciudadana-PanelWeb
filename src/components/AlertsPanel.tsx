import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Car, 
  XCircle, 
  AlertTriangle,
  Navigation
} from 'lucide-react';
import type { AlertaReporte, UserSession } from '../types';

interface AlertsPanelProps {
  alerts: AlertaReporte[];
  session: UserSession;
  onUpdateStatus: (alertId: number, newStatusId: number, statusName: string) => void;
  onSelectAlert: (alert: AlertaReporte) => void;
  selectedAlertId: number | null;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  alerts,
  onUpdateStatus,
  onSelectAlert,
  selectedAlertId,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterType === 'all') return true;
    if (filterType === 'active') return a.id_estado === 1 || a.id_estado === 2;
    if (filterType === 'resolved') return a.id_estado === 3;
    if (filterType === 'robo') return a.tipo_incidencia?.nombre?.toLowerCase().includes('robo');
    return true;
  });

  const getStatusBadge = (idEstado: number) => {
    switch (idEstado) {
      case 1:
        return <span style={{ background: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>🚨 PENDIENTE</span>;
      case 2:
        return <span style={{ background: '#f59e0b', color: 'black', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>🚓 EN CAMINO</span>;
      case 3:
        return <span style={{ background: '#10b981', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>✅ ATENDIDA</span>;
      case 4:
        return <span style={{ background: '#64748b', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>❌ FALSA ALARMA</span>;
      default:
        return <span style={{ background: '#3b82f6', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>REGISTRADA</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Top Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'rgba(18, 24, 38, 0.7)',
        border: '1px solid var(--border-color)',
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Centro de Despacho & Monitor Táctico
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(239,68,68,0.2)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.4)',
              fontWeight: 700,
            }}>
              LIVE WEBSOCKET
            </span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Despacho inmediato de patrullas y seguimiento táctico de emergencias ciudadanas en Pisco
          </p>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              background: filterType === 'all' ? 'white' : 'rgba(0,0,0,0.3)',
              color: filterType === 'all' ? 'black' : 'var(--text-muted)',
            }}
          >
            Todas ({alerts.length})
          </button>
          <button
            onClick={() => setFilterType('active')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid rgba(239,68,68,0.3)',
              background: filterType === 'active' ? '#ef4444' : 'rgba(239,68,68,0.1)',
              color: filterType === 'active' ? 'white' : '#fca5a5',
            }}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilterType('robo')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid rgba(245,158,11,0.3)',
              background: filterType === 'robo' ? '#f59e0b' : 'rgba(245,158,11,0.1)',
              color: filterType === 'robo' ? 'black' : '#fde68a',
            }}
          >
            Robos / Arrebatos
          </button>
        </div>
      </div>

      {/* Main Grid: Lista de Alertas + Panel de Acción */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0,
      }}>
        {/* Left: Lista de Alertas */}
        <div style={{
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          paddingRight: '6px',
        }}>
          {filteredAlerts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: '12px' }} />
              <h3>No hay alertas pendientes en esta categoría</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>El sistema se mantiene en escucha activa vía WebSockets.</p>
            </div>
          ) : (
            filteredAlerts.map((a) => {
              const isSelected = selectedAlertId === a.id_reporte;
              const isRobo = a.tipo_incidencia?.nombre?.toLowerCase().includes('robo');
              const lat = a.ubicacion?.latitud || -13.7142;
              const lon = a.ubicacion?.longitud || -76.2038;

              return (
                <div
                  key={a.id_reporte}
                  onClick={() => onSelectAlert(a)}
                  className={`glass-panel ${a.id_estado === 1 ? 'alert-flash' : ''}`}
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: isSelected 
                      ? '2px solid #38bdf8' 
                      : a.id_estado === 1 
                        ? '1px solid rgba(239,68,68,0.5)' 
                        : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(30, 41, 59, 0.9)' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isRobo ? '#f87171' : '#38bdf8',
                      }}>
                        {a.tipo_incidencia?.nombre || 'EMERGENCIA GENERAL'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        #REP-{a.id_reporte}
                      </span>
                    </div>
                    {getStatusBadge(a.id_estado)}
                  </div>

                  <p style={{ fontSize: '13px', color: '#e2e8f0', marginBottom: '10px', lineHeight: '1.4' }}>
                    {a.descripcion}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} color="#f87171" />
                      <span>{a.ubicacion?.direccion_texto || `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      <span>{new Date(a.fecha_hora).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {a.ciudadano && (
                    <div style={{
                      marginTop: '8px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Víctima: <strong style={{ color: 'white' }}>{a.ciudadano.nombres} {a.ciudadano.apellidos}</strong> (DNI: {a.ciudadano.dni})
                      </span>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>
                        +51 {a.ciudadano.telefono}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Panel Táctico con control total para ambos roles */}
        <div className="glass-panel" style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {selectedAlertId ? (
            (() => {
              const current = alerts.find((x) => x.id_reporte === selectedAlertId);
              if (!current) return null;
              const lat = current.ubicacion?.latitud || -13.7142;
              const lon = current.ubicacion?.longitud || -76.2038;
              const gmapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;

              return (
                <>
                  <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f87171' }}>
                        Despacho Táctico: Incidente #{current.id_reporte}
                      </h3>
                      {getStatusBadge(current.id_estado)}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Registrado: {new Date(current.fecha_hora).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 700, color: 'white', marginBottom: '6px' }}>
                      Datos del Ciudadano Afectado:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: 'var(--text-muted)' }}>
                      <div>Nombre: <strong style={{ color: '#f1f5f9' }}>{current.ciudadano?.nombres || 'No especificado'}</strong></div>
                      <div>DNI: <strong style={{ color: '#f1f5f9' }}>{current.ciudadano?.dni || 'Sin DNI'}</strong></div>
                      <div>Teléfono: <strong style={{ color: '#38bdf8' }}>{current.ciudadano?.telefono || 'No reg.'}</strong></div>
                      <div>Lugar: <strong style={{ color: '#f87171' }}>{current.ubicacion?.direccion_texto || 'Pisco'}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a
                      href={gmapsNavUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        background: '#2563eb',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Navigation size={14} />
                      Navegar a Coordenadas (Google Maps)
                      <ExternalLink size={12} />
                    </a>
                  </div>

                  {/* Acciones de Despacho (Exactamente idénticas para Técnico y Administrador) */}
                  <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '10px' }}>
                      Acciones de Despacho Inmediato & Mando Operativo:
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button
                        onClick={() => onUpdateStatus(current.id_reporte, 2, 'En Camino')}
                        style={{
                          background: '#d97706',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <Car size={14} />
                        Despachar Patrulla
                      </button>

                      <button
                        onClick={() => onUpdateStatus(current.id_reporte, 3, 'Atendida')}
                        style={{
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          padding: '10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={14} />
                        Marcar Atendida
                      </button>

                      <button
                        onClick={() => onUpdateStatus(current.id_reporte, 4, 'Falsa Alarma')}
                        style={{
                          background: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.3)',
                          padding: '10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <XCircle size={14} />
                        Falsa Alarma
                      </button>

                      <button
                        onClick={() => onUpdateStatus(current.id_reporte, 1, 'Pendiente')}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-color)',
                          padding: '10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                        }}
                      >
                        <AlertTriangle size={14} />
                        Reabrir Alerta
                      </button>
                    </div>
                  </div>
                </>
              );
            })()
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-dim)' }}>
              <Navigation size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Selecciona una alerta del listado para ver su telemetría y despacho táctico.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
