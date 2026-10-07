import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, ExternalLink, Radio, Navigation, Clock, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AlertaReporte } from '../types';

interface LiveTrackingModalProps {
  alert: AlertaReporte;
  onClose: () => void;
}

interface UbicacionPoint {
  id?: number;
  id_reporte: number;
  latitud: number;
  longitud: number;
  fecha_hora?: string;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({ alert, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const initialLat = alert.ubicacion?.latitud || -13.7142;
  const initialLon = alert.ubicacion?.longitud || -76.2038;

  const [points, setPoints] = useState<UbicacionPoint[]>([
    {
      id_reporte: alert.id_reporte,
      latitud: initialLat,
      longitud: initialLon,
      fecha_hora: alert.fecha_hora,
    },
  ]);
  const [lastUpdate, setLastUpdate] = useState<string>('Conectando...');
  const [isLive, setIsLive] = useState<boolean>(true);

  const currentLat = points.length > 0 ? points[points.length - 1].latitud : initialLat;
  const currentLon = points.length > 0 ? points[points.length - 1].longitud : initialLon;

  // 1. Inicializar el Mapa con Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 16,
      });

      // CartoDB Dark Matter tiles para estética táctica nocturna
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Ícono de punto de origen
      const startIcon = L.divIcon({
        className: 'custom-start-marker',
        html: `<div style="background:#0284c7;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px #0284c7;"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      startMarkerRef.current = L.marker([initialLat, initialLon], { icon: startIcon })
        .addTo(map)
        .bindPopup('<b>📍 Punto Inicial del Reporte</b>');

      // Ícono pulsante rojo para posición actual en vivo
      const pulseIcon = L.divIcon({
        className: 'custom-pulse-marker',
        html: `
          <div style="position:relative;width:22px;height:22px;">
            <div style="position:absolute;width:22px;height:22px;border-radius:50%;background:rgba(239,68,68,0.5);animation:pulse-marker 1.4s infinite ease-out;"></div>
            <div style="position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 12px #ef4444;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      markerRef.current = L.marker([initialLat, initialLon], { icon: pulseIcon })
        .addTo(map)
        .bindPopup(`<b>🚨 Posición Actual de la Víctima (ROBO)</b><br>Incidente #${alert.id_reporte}`)
        .openPopup();

      // Línea de ruta de desplazamiento
      polylineRef.current = L.polyline([[initialLat, initialLon]], {
        color: '#ef4444',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Cargar historial inicial de puntos y suscribirse a Supabase Realtime
  useEffect(() => {
    let isSubscribed = true;

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('ubicacion')
          .select('id_ubicacion, id_reporte, latitud, longitud, fecha_hora')
          .eq('id_reporte', alert.id_reporte)
          .order('id_ubicacion', { ascending: true });

        if (!error && data && data.length > 0 && isSubscribed) {
          const mapped: UbicacionPoint[] = data.map((d: any) => ({
            id: d.id_ubicacion,
            id_reporte: d.id_reporte,
            latitud: Number(d.latitud),
            longitud: Number(d.longitud),
            fecha_hora: d.fecha_hora,
          }));
          setPoints(mapped);
          setLastUpdate(new Date().toLocaleTimeString('es-PE'));
          updateMapRoute(mapped);
        }
      } catch (err) {
        console.warn('Error cargando historial de ubicaciones:', err);
      }
    };

    fetchHistory();

    // Suscripción Realtime a inserciones en la tabla 'ubicacion'
    const channel = supabase
      .channel(`tracking-report-${alert.id_reporte}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ubicacion',
          filter: `id_reporte=eq.${alert.id_reporte}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow && newRow.latitud && newRow.longitud && isSubscribed) {
            const newPoint: UbicacionPoint = {
              id: newRow.id_ubicacion,
              id_reporte: newRow.id_reporte,
              latitud: Number(newRow.latitud),
              longitud: Number(newRow.longitud),
              fecha_hora: newRow.fecha_hora || new Date().toISOString(),
            };
            setPoints((prev) => {
              const next = [...prev, newPoint];
              updateMapRoute(next);
              return next;
            });
            setLastUpdate(new Date().toLocaleTimeString('es-PE'));
            setIsLive(true);
          }
        }
      )
      .subscribe();

    // Polling preventivo de respaldo cada 5 segundos
    const pollTimer = setInterval(() => {
      fetchHistory();
    }, 5000);

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
      clearInterval(pollTimer);
    };
  }, [alert.id_reporte]);

  // Actualizar marcadores y polilínea en el mapa
  const updateMapRoute = (currentPoints: UbicacionPoint[]) => {
    if (!mapInstanceRef.current || currentPoints.length === 0) return;

    const latLngs: [number, number][] = currentPoints.map((p) => [p.latitud, p.longitud]);
    const latest = latLngs[latLngs.length - 1];

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latLngs);
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(latest);
      markerRef.current.setPopupContent(
        `<b>🚨 Posición Actual (Punto #${currentPoints.length})</b><br>` +
        `Lat: ${latest[0].toFixed(5)}, Lon: ${latest[1].toFixed(5)}<br>` +
        `<small style="color:#94a3b8">Hora: ${new Date().toLocaleTimeString('es-PE')}</small>`
      );
    }

    // Centrar mapa suavemente en la nueva posición
    mapInstanceRef.current.panTo(latest, { animate: true, duration: 1.0 });
  };

  const gmapsPinUrl = `https://www.google.com/maps?q=${currentLat},${currentLon}`;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: '#0B0E14',
        border: '1px solid #ef4444',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '1200px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35)',
      }}>
        {/* Modal Header */}
        <div style={{
          background: '#111827',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '17px', fontWeight: 800 }}>
                  Rastreo Táctico en Vivo — Incidente #{alert.id_reporte}
                </h3>
                <span style={{
                  background: isLive ? '#ef4444' : '#64748b',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <Radio size={12} />
                  {isLive ? 'EN VIVO (5s)' : 'PAUSADO'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Víctima: <strong style={{ color: '#f8fafc' }}>{alert.ciudadano?.nombres || 'Ciudadano'} {alert.ciudadano?.apellidos || ''}</strong> (DNI: {alert.ciudadano?.dni || 'No reg.'}) | Tel: {alert.ciudadano?.telefono || 'No reg.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href={gmapsPinUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#2563eb',
                color: 'white',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Navigation size={14} />
              Ver en Google Maps
              <ExternalLink size={12} />
            </a>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-color)',
                color: 'white',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Cerrar ventana de seguimiento"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Map + Floating Telemetry Box */}
        <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%' }}>
          {/* Leaflet Map Div */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Floating Telemetry Box */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '14px 16px',
            minWidth: '260px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
            fontSize: '12px',
            color: 'white',
          }}>
            <div style={{
              fontWeight: 800,
              color: '#f87171',
              marginBottom: '10px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Radio size={14} color="#ef4444" />
              Telemetría Móvil Continua
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Puntos transmitidos:</span>
              <strong style={{ color: '#38bdf8' }}>{points.length} puntos</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Latitud actual:</span>
              <strong style={{ fontFamily: 'monospace' }}>{currentLat.toFixed(5)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Longitud actual:</span>
              <strong style={{ fontFamily: 'monospace' }}>{currentLon.toFixed(5)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Última señal:</span>
              <span style={{ color: '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                {lastUpdate}
              </span>
            </div>

            <div style={{
              fontSize: '11px',
              color: 'var(--text-dim)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '6px',
            }}>
              📡 Coordenadas recibidas cada 5s directamente desde el sensor GPS del dispositivo móvil.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
