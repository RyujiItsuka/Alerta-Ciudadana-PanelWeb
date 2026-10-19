import React, { useState } from 'react';
import { 
  Sliders, 
  Gauge, 
  MapPin, 
  Save, 
  RotateCcw, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import type { SystemConfig } from '../types';

interface TechnicianCalibrationProps {
  config: SystemConfig;
  // Persiste la configuración en el servidor (Edge Function `security`).
  // Puede lanzar un error para que el usuario vea el motivo del fallo.
  onSaveConfig: (updated: SystemConfig) => Promise<void> | void;
}

export const TechnicianCalibration: React.FC<TechnicianCalibrationProps> = ({
  config,
  onSaveConfig,
}) => {
  const [phone, setPhone] = useState(config.phoneCentral);
  const [shakeThreshold, setShakeThreshold] = useState(config.sensorShakeThreshold);
  const [gpsInterval, setGpsInterval] = useState(config.gpsTrackingIntervalSeconds);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Guarda el número de WhatsApp de la Central en la base de datos. El despacho
  // lo resuelve en el servidor, así que el cambio aplica a todas las apps
  // móviles sin necesidad de actualizarlas ni recompilar el APK.
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSavedSuccess(false);
    try {
      await onSaveConfig({
        ...config,
        phoneCentral: phone,
        sensorShakeThreshold: shakeThreshold,
        gpsTrackingIntervalSeconds: gpsInterval,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la configuración en el servidor.'
      );
    } finally {
      setSaving(false);
    }
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

      {saveError && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.4)',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          <AlertTriangle size={16} />
          {saveError}
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
            📞 Número Central de Recepción WhatsApp (Green-API)
          </label>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
            Línea a la cual el backend despacha los mensajes de socorro. Se guarda en la base de datos
            (tabla <code>configuracion_sistema</code>): el servidor la resuelve en cada alerta, así que el
            cambio aplica al instante en todas las apps móviles, sin actualizar el APK.
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
            disabled={saving}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#0284c7',
              color: 'white',
              fontWeight: 700,
              fontSize: '13px',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Save size={16} />
            {saving ? 'Guardando...' : 'Guardar Configuración Técnica'}
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
          <strong>Nota de Arquitectura:</strong> El número de WhatsApp de la Central se guarda en la base de
          datos y lo resuelve el servidor (Edge Function <code>whatsapp</code>) en el momento de despachar,
          por lo que puede cambiarse sin tocar la app. Los umbrales de sensores y el intervalo GPS siguen
          siendo valores locales de cada dispositivo.
        </span>
      </div>
    </div>
  );
};
