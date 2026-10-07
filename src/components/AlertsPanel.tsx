import React, { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Car, 
  XCircle, 
  Navigation,
  Radio
} from 'lucide-react';
import type { AlertaReporte, UserSession } from '../types';
import { LiveTrackingModal } from './LiveTrackingModal';

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
  const [trackingAlert, setTrackingAlert] = useState<AlertaReporte | null>(null);

  // EN DESPACHO & ALERTAS: SOLO se muestran alertas activas (Pendientes: 1 y En camino: 2)
  // Las alertas Atendidas (3) y Falsas Alarmas (4) pasan automáticamente a Historial de Alertas.
  // Ordenadas cronológicamente por hora de activación (más recientes primero).
  const activeAlerts = alerts
    .filter((a) => a.id_estado === 1 || a.id_estado === 2)
    .sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

  const filteredAlerts = activeAlerts.filter((a) => {
    if (filterType === 'all') return true;
    if (filterType === 'pending') return a.id_estado === 1;
    if (filterType === 'onway') return a.id_estado === 2;
    return true;
  });

  const countPending = activeAlerts.filter(a => a.id_estado === 1).length;
  const countOnWay = activeAlerts.filter(a => a.id_estado === 2).length;

  // Si la alerta seleccionada dejó de estar activa (se marcó como atendida o falsa alarma),
  // auto-seleccionar la primera alerta activa restante para mantener el detalle actualizado.
  React.useEffect(() => {
    if (filteredAlerts.length > 0) {
      const isSelectedStillActive = filteredAlerts.some((a) => a.id_reporte === selectedAlertId);
      if (!isSelectedStillActive) {
        onSelectAlert(filteredAlerts[0]);
      }
    }
  }, [filteredAlerts, selectedAlertId, onSelectAlert]);

  const getStatusBadge = (idEstado: number) => {
    switch (idEstado) {
      case 1:
        return <span style={{ background: '#ef4444', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>🚨 PENDIENTE</span>;
      case 2:
        return <span style={{ background: '#f59e0b', color: 'black', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>🚓 EN CAMINO</span>;
      default:
        return <span style={{ background: '#3b82f6', color: 'white', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>ACTIVA</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* Top Action Bar */}
      <div className="responsive-topbar">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
        <div className="filters-scroll-row">
          <button
            onClick={() => setFilterType('all')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: '1px solid var(--border-color)',
              background: filterType === 'all' ? 'white' : 'rgba(0,0,0,0.3)',
              color: filterType === 'all' ? 'black' : 'var(--text-muted)',
            }}
          >
            Todas ({activeAlerts.length})
          </button>
          <button
            onClick={() => setFilterType('pending')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(239,68,68,0.3)',
              background: filterType === 'pending' ? '#ef4444' : 'rgba(239,68,68,0.1)',
              color: filterType === 'pending' ? 'white' : '#fca5a5',
            }}
          >
            Pendientes ({countPending})
          </button>
          <button
            onClick={() => setFilterType('onway')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              border: '1px solid rgba(245,158,11,0.3)',
              background: filterType === 'onway' ? '#f59e0b' : 'rgba(245,158,11,0.1)',
              color: filterType === 'onway' ? 'black' : '#fde68a',
            }}
          >
            En camino ({countOnWay})
          </button>
        </div>
      </div>

      {/* Main Grid: Lista de Alertas + Panel de Acción */}
      <div className="responsive-two-col">
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
              const gmapsPointUrl = `https://www.google.com/maps?q=${lat},${lon}`;
              const isRobo =
                current.tipo_incidencia?.nombre?.toLowerCase().includes('robo') ||
                current.descripcion?.toLowerCase().includes('robo') ||
                current.descripcion?.toLowerCase().includes('arrebato');

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

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a
                      href={gmapsPointUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        minWidth: '180px',
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
                      <MapPin size={14} />
                      Ver Ubicación (Google Maps)
                      <ExternalLink size={12} />
                    </a>

                    {isRobo && (
                      <button
                        onClick={() => {
                          const trackingUrl = `${window.location.origin}${window.location.pathname}?tracking=${current.id_reporte}`;
                          window.open(trackingUrl, `tracking_${current.id_reporte}`, 'width=1280,height=820,menubar=no,status=no,toolbar=no');
                        }}
                        style={{
                          flex: 1,
                          minWidth: '180px',
                          background: '#dc2626',
                          color: 'white',
                          padding: '10px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: '0 0 14px rgba(220,38,38,0.5)',
                        }}
                        title="Abrir seguimiento GPS en ventana independiente del navegador para monitorear múltiples incidentes a la vez"
                      >
                        <Radio size={14} />
                        🔴 SEGUIMIENTO GPS EN VIVO
                        <ExternalLink size={12} />
                      </button>
                    )}
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
                          gridColumn: 'span 2',
                          background: 'rgba(239,68,68,0.12)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.25)',
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

      {trackingAlert && (
        <LiveTrackingModal
          alert={trackingAlert}
          onClose={() => setTrackingAlert(null)}
        />
      )}
    </div>
  );
};
