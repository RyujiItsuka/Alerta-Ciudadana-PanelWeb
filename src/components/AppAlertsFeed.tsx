import React, { useState } from 'react';
import { 
  BellRing, 
  MapPin, 
  Clock, 
  Search, 
  Smartphone, 
  ExternalLink,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import type { AlertaReporte } from '../types';

interface AppAlertsFeedProps {
  alerts: AlertaReporte[];
  onSelectAlert: (alert: AlertaReporte) => void;
  selectedAlertId: number | null;
}

export const AppAlertsFeed: React.FC<AppAlertsFeedProps> = ({
  alerts,
  onSelectAlert,
  selectedAlertId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = alerts.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = 
      a.descripcion.toLowerCase().includes(q) ||
      (a.tipo_incidencia?.nombre?.toLowerCase() || '').includes(q) ||
      (a.ciudadano?.nombres?.toLowerCase() || '').includes(q) ||
      (a.ciudadano?.dni || '').includes(q);

    if (!matchSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'robo') return a.tipo_incidencia?.nombre?.toLowerCase().includes('robo');
    if (filterType === 'panico') return a.tipo_incidencia?.nombre?.toLowerCase().includes('pánico') || a.tipo_incidencia?.nombre?.toLowerCase().includes('general');
    if (filterType === 'accidente') return a.tipo_incidencia?.nombre?.toLowerCase().includes('accidente');
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header Bar */}
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
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BellRing size={20} />
            Alertas App — Centro Receptor de Alertas Ciudadanas
            <span style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(239,68,68,0.2)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.4)',
              fontWeight: 700,
            }}>
              TODOS LOS USUARIOS
            </span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Bandeja unificada con todas las alertas disparadas por los usuarios desde la aplicación móvil o WhatsApp
          </p>
        </div>

        {/* Buscador & Filtros */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Buscar por DNI, Nombre o tipo..."
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

          <div style={{ display: 'flex', gap: '6px' }}>
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
              onClick={() => setFilterType('robo')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid rgba(239,68,68,0.3)',
                background: filterType === 'robo' ? '#ef4444' : 'rgba(239,68,68,0.1)',
                color: filterType === 'robo' ? 'white' : '#fca5a5',
              }}
            >
              Robo / Arrebato
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Lista Completa de Alertas + Detalle de Telemetría */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Lista de Alertas */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '6px' }}>
          {filtered.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} color="#10b981" style={{ marginBottom: '12px' }} />
              <h3>No hay alertas registradas</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>El sistema recibe alertas automáticamente de toda la comunidad.</p>
            </div>
          ) : (
            filtered.map((a) => {
              const isSelected = selectedAlertId === a.id_reporte;
              const isRobo = a.tipo_incidencia?.nombre?.toLowerCase().includes('robo');
              const lat = a.ubicacion?.latitud || -13.7142;
              const lon = a.ubicacion?.longitud || -76.2038;

              return (
                <div
                  key={a.id_reporte}
                  onClick={() => onSelectAlert(a)}
                  className="glass-panel"
                  style={{
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: isSelected 
                      ? '2px solid #ef4444' 
                      : a.id_estado === 1 
                        ? '1px solid rgba(239,68,68,0.4)' 
                        : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(30, 41, 59, 0.95)' : 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: isRobo ? '#f87171' : '#38bdf8',
                      }}>
                        🚨 {a.tipo_incidencia?.nombre || 'ALERTA CIUDADANA'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        ID #{a.id_reporte}
                      </span>
                    </div>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: a.id_estado === 1 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                      color: a.id_estado === 1 ? '#f87171' : '#34d399',
                    }}>
                      {a.id_estado === 1 ? 'ACTIVA' : 'ATENDIDA'}
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: '#f1f5f9', marginBottom: '10px', lineHeight: '1.4' }}>
                    {a.descripcion}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
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
                      fontSize: '11px',
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Emisor: <strong style={{ color: 'white' }}>{a.ciudadano.nombres} {a.ciudadano.apellidos}</strong> (DNI: {a.ciudadano.dni})
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

        {/* Detalle y Geolocalización de Alerta Seleccionada */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                        Detalle de Alerta #{current.id_reporte}
                      </h3>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#dc2626', color: 'white', fontWeight: 700 }}>
                        {current.tipo_incidencia?.nombre || 'EMERGENCIA'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Hora de emisión: {new Date(current.fecha_hora).toLocaleString()}
                    </span>
                  </div>

                  {/* Ficha Ciudadano */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '8px', fontSize: '13px' }}>
                    <div style={{ fontWeight: 700, color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Smartphone size={16} color="#38bdf8" />
                      Usuario Emisor desde la App:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: 'var(--text-muted)' }}>
                      <div>Nombres: <strong style={{ color: '#f1f5f9' }}>{current.ciudadano?.nombres || 'Ciudadano'}</strong></div>
                      <div>DNI: <strong style={{ color: '#f1f5f9' }}>{current.ciudadano?.dni || 'No reg.'}</strong></div>
                      <div>Teléfono Móvil: <strong style={{ color: '#38bdf8' }}>+51 {current.ciudadano?.telefono || 'No reg.'}</strong></div>
                      <div>Estado: <strong style={{ color: '#34d399' }}>Cuenta Verificada</strong></div>
                    </div>
                  </div>

                  {/* Mensaje emitido */}
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Contenido / Motivo de Alarma:
                    </label>
                    <div style={{
                      marginTop: '4px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-color)',
                      color: 'white',
                      fontSize: '13px',
                      lineHeight: '1.4',
                    }}>
                      {current.descripcion}
                    </div>
                  </div>

                  {/* Acceso a GPS */}
                  <div style={{ marginTop: 'auto' }}>
                    <a
                      href={gmapsNavUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        width: '100%',
                        background: '#2563eb',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <Navigation size={16} />
                      Rastrear y Navegar a Coordenadas (Google Maps)
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </>
              );
            })()
          ) : (
            <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-dim)' }}>
              <BellRing size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p>Selecciona una alerta ciudadana del feed para ver sus coordenadas y telemetría completa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
