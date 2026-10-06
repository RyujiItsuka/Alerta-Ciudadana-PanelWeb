import React, { useState } from 'react';
import { 
  Sliders, 
  Gauge, 
  MapPin, 
  Save, 
  RotateCcw, 
  Info,
  CheckCircle2
} from 'lucide-react';
import type { SystemConfig } from '../types';

interface TechnicianCalibrationProps {
  config: SystemConfig;
  onSaveConfig: (updated: SystemConfig) => void;
}

export const TechnicianCalibration: React.FC<TechnicianCalibrationProps> = ({
  config,
  onSaveConfig,
}) => {
  const [phone, setPhone] = useState(config.phoneCentral);
  const [shakeThreshold, setShakeThreshold] = useState(config.sensorShakeThreshold);
  const [gpsInterval, setGpsInterval] = useState(config.gpsTrackingIntervalSeconds);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      ...config,
      phoneCentral: phone,
      sensorShakeThreshold: shakeThreshold,
      gpsTrackingIntervalSeconds: gpsInterval,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    setPhone('51976264949');
    setShakeThreshold(28.0);
    setGpsInterval(5);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', maxWidth: '850px' }}>
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'rgba(18, 24, 38, 0.7)',
        border: '1px solid var(--border-color)',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={20} />
          Calibración de Parámetros de Sensores & Telemetría
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Ajustes globales para la detección de arrebato, frecuencias GPS y números de emergencia
        </p>
      </div>

      {savedSuccess && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid rgba(16,185,129,0.4)',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          <CheckCircle2 size={16} />
          Parámetros actualizados y sincronizados con Supabase correctamente.
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            📞 Número Central de Recepción WhatsApp (Green-API)
          </label>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Línea telefónica a la cual el backend despachará los mensajes de socorro de los ciudadanos.
          </span>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '350px',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '14px',
              fontFamily: 'monospace',
              outline: 'none',
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Gauge size={16} color="#f59e0b" />
              Sensibilidad Sensor de Arrebato (Jalón Brusco)
            </label>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#f59e0b', fontSize: '14px' }}>
              {shakeThreshold.toFixed(1)} m/s²
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
            Valores estándar: <strong>26 - 32 m/s²</strong> para evitar falsos positivos al dejar el teléfono sobre la cama o mesa.
          </span>
          <input
            type="range"
            min="15.0"
            max="45.0"
            step="0.5"
            value={shakeThreshold}
            onChange={(e) => setShakeThreshold(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            <span>15 m/s² (Muy Sensible)</span>
            <span>28 m/s² (Recomendado Google)</span>
            <span>45 m/s² (Muy Rígido)</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={16} color="#06b6d4" />
              Intervalo de Muestreo de Ruta GPS en Vivo
            </label>
            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#06b6d4', fontSize: '14px' }}>
              Cada {gpsInterval} segundos
            </span>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}>
            Frecuencia con la que el celular de la víctima reporta su telemetría cuando se activa el modo persecución.
          </span>
          <input
            type="range"
            min="2"
            max="30"
            step="1"
            value={gpsInterval}
            onChange={(e) => setGpsInterval(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            type="submit"
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#0284c7',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Save size={16} />
            Guardar Configuración Técnica
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RotateCcw size={15} />
            Restablecer Valores de Fábrica
          </button>
        </div>
      </form>

      <div style={{
        padding: '14px 18px',
        borderRadius: '8px',
        background: 'rgba(2,132,199,0.06)',
        border: '1px solid rgba(2,132,199,0.2)',
        fontSize: '12px',
        color: 'var(--text-muted)',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
      }}>
        <Info size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Nota de Arquitectura:</strong> Estos parámetros son leídos por la app móvil a través de Supabase en cada inicio de sesión, permitiendo calibrar la sensibilidad del sensor de arrebato sin obligar a los ciudadanos a reinstalar el APK.
        </span>
      </div>
    </div>
  );
};
