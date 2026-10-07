import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, ExternalLink, Radio, Navigation, Clock, ShieldAlert, AlertTriangle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AlertaReporte } from '../types';

interface LiveTrackingModalProps {
  alert: AlertaReporte;
  onClose: () => void;
  isStandalone?: boolean;
}

interface UbicacionPoint {
  id?: number;
  id_reporte: number;
  latitud: number;
  longitud: number;
  fecha_hora?: string;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({ alert, onClose, isStandalone = false }) => {
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
  const [isCancelled, setIsCancelled] = useState<boolean>(false);
  const [cancelledTime, setCancelledTime] = useState<string>('');

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

      // OpenStreetMap estándar (100% gratuito, sin necesidad de API key)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
          // Detectar si existe marcador de cancelación (0,0) enviado por la app
          const cancelPoint = data.find((d: any) => Math.abs(Number(d.latitud)) < 0.0001 && Math.abs(Number(d.longitud)) < 0.0001);
          if (cancelPoint) {
            setIsCancelled(true);
            setIsLive(false);
            setCancelledTime(new Date(cancelPoint.fecha_hora || Date.now()).toLocaleTimeString('es-PE'));
          }

          // Filtrar coordenadas reales válidas (excluyendo el marcador 0,0 de cancelación)
          const validRows = data.filter((d: any) => !(Math.abs(Number(d.latitud)) < 0.0001 && Math.abs(Number(d.longitud)) < 0.0001));
          if (validRows.length > 0) {
            const mapped: UbicacionPoint[] = validRows.map((d: any) => ({
              id: d.id_ubicacion,
              id_reporte: d.id_reporte,
              latitud: Number(d.latitud),
              longitud: Number(d.longitud),
              fecha_hora: d.fecha_hora,
            }));
            setPoints(mapped);
            setLastUpdate(new Date(mapped[mapped.length - 1].fecha_hora || Date.now()).toLocaleTimeString('es-PE'));
            updateMapRoute(mapped, cancelPoint != null);
          }
        }

        // También verificar estado en tabla reporte
        const { data: repData } = await supabase
          .from('reporte')
          .select('descripcion, id_estado')
          .eq('id_reporte', alert.id_reporte)
          .single();

        if (repData && isSubscribed) {
          if (repData.descripcion?.includes('[TRANSMISIÓN DE UBICACIÓN FINALIZADA POR EL USUARIO]') || repData.descripcion?.includes('[CANCELADO_POR_USUARIO]')) {
            setIsCancelled(true);
            setIsLive(false);
          }
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
          if (newRow && isSubscribed) {
            const lat = Number(newRow.latitud);
            const lon = Number(newRow.longitud);

            // Si llega el marcador especial (0, 0), indica que el usuario canceló el rastreo desde la app
            if (Math.abs(lat) < 0.0001 && Math.abs(lon) < 0.0001) {
              const nowTime = new Date().toLocaleTimeString('es-PE');
              setIsCancelled(true);
              setIsLive(false);
              setCancelledTime(nowTime);
              setPoints((prev) => {
                updateMapRoute(prev, true);
                return prev;
              });
              return;
            }

            const newPoint: UbicacionPoint = {
              id: newRow.id_ubicacion,
              id_reporte: newRow.id_reporte,
              latitud: lat,
              longitud: lon,
              fecha_hora: newRow.fecha_hora || new Date().toISOString(),
            };
            setPoints((prev) => {
              const next = [...prev, newPoint];
              updateMapRoute(next, false);
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
  const updateMapRoute = (currentPoints: UbicacionPoint[], cancelled: boolean = false) => {
    if (!mapInstanceRef.current || currentPoints.length === 0) return;

    const latLngs: [number, number][] = currentPoints.map((p) => [p.latitud, p.longitud]);
    const latest = latLngs[latLngs.length - 1];

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(latLngs);
      polylineRef.current.setStyle({
        color: cancelled ? '#f59e0b' : '#ef4444',
      });
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(latest);
      if (cancelled) {
        markerRef.current.setPopupContent(
          `<b>⏹️ Última Posición Recibida (Rastreo Finalizado)</b><br>` +
          `Lat: ${latest[0].toFixed(5)}, Lon: ${latest[1].toFixed(5)}<br>` +
          `<small style="color:#ef4444;font-weight:700;">⚠️ Transmisión cancelada por el usuario</small><br>` +
          `<small style="color:#94a3b8">Hora guardada: ${new Date().toLocaleTimeString('es-PE')}</small>`
        ).openPopup();
      } else {
        markerRef.current.setPopupContent(
          `<b>🚨 Posición Actual (Punto #${currentPoints.length})</b><br>` +
          `Lat: ${latest[0].toFixed(5)}, Lon: ${latest[1].toFixed(5)}<br>` +
          `<small style="color:#94a3b8">Hora: ${new Date().toLocaleTimeString('es-PE')}</small>`
        );
      }
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
      background: isStandalone ? '#0B0E14' : 'rgba(0,0,0,0.85)',
      backdropFilter: isStandalone ? 'none' : 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isStandalone ? 0 : '16px',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <div style={{
        background: '#0B0E14',
        border: isStandalone ? 'none' : '1px solid #ef4444',
        borderRadius: isStandalone ? 0 : '16px',
        width: '100%',
        maxWidth: isStandalone ? '100%' : '1200px',
        height: isStandalone ? '100vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isStandalone ? 'none' : '0 25px 50px -12px rgba(239, 68, 68, 0.35)',
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
              background: isCancelled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
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
                {isCancelled ? (
                  <span style={{
                    background: '#b91c1c',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 0 10px rgba(185, 28, 28, 0.5)',
                  }}>
                    <XCircle size={13} />
                    CANCELADO POR EL USUARIO
                  </span>
                ) : (
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
                )}
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
              {isCancelled ? 'Ver última ubicación en Google Maps' : 'Ver en Google Maps'}
              <ExternalLink size={12} />
            </a>

            {!isStandalone && (
              <button
                onClick={() => {
                  const trackingUrl = `${window.location.origin}${window.location.pathname}?tracking=${alert.id_reporte}`;
                  window.open(trackingUrl, `tracking_${alert.id_reporte}`, 'width=1280,height=820,menubar=no,status=no,toolbar=no');
                  onClose();
                }}
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#f87171',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Abrir en ventana independiente del navegador"
              >
                <ExternalLink size={14} />
                Ventana Nueva
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border-color)',
                color: 'white',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 600,
              }}
              title={isStandalone ? 'Cerrar esta ventana' : 'Cerrar ventana de seguimiento'}
            >
              <X size={18} />
              {isStandalone && <span>Cerrar</span>}
            </button>
          </div>
        </div>

        {/* Modal Body: Map + Floating Telemetry Box + Cancellation Banner */}
        <div style={{ position: 'relative', flex: 1, width: '100%', height: '100%' }}>
          {/* Leaflet Map Div */}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Banner de Cancelación por el Usuario */}
          {isCancelled && (
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: 'rgba(185, 28, 28, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #f87171',
              borderRadius: '12px',
              padding: '12px 20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              color: 'white',
              maxWidth: '90%',
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <AlertTriangle size={24} color="#fef08a" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#ffffff' }}>
                  ⚠️ Transmisión de ubicación en vivo cancelada por el usuario
                </div>
                <div style={{ fontSize: '12px', color: '#fecaca', marginTop: '2px' }}>
                  El usuario finalizó el seguimiento desde la aplicación móvil{cancelledTime ? ` a las ${cancelledTime}` : ''}.
                  La <strong>última ubicación recibida se encuentra guardada</strong> y permanece fijada en el mapa ({currentLat.toFixed(5)}, {currentLon.toFixed(5)}).
                </div>
              </div>
            </div>
          )}

          {/* Floating Telemetry Box */}
          <div style={{
            position: 'absolute',
            top: isCancelled ? '85px' : '16px',
            right: '16px',
            zIndex: 1000,
            background: 'rgba(15, 23, 42, 0.94)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.6)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            minWidth: '260px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.7)',
            fontSize: '12px',
            color: 'white',
          }}>
            <div style={{
              fontWeight: 800,
              color: isCancelled ? '#fca5a5' : '#f87171',
              marginBottom: '10px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              paddingBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Radio size={14} color={isCancelled ? '#f87171' : '#ef4444'} />
              {isCancelled ? 'Rastreo Finalizado (Guardado)' : 'Telemetría Móvil Continua'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Puntos transmitidos:</span>
              <strong style={{ color: '#38bdf8' }}>{points.length} puntos</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{isCancelled ? 'Última latitud:' : 'Latitud actual:'}</span>
              <strong style={{ fontFamily: 'monospace' }}>{currentLat.toFixed(5)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{isCancelled ? 'Última longitud:' : 'Longitud actual:'}</span>
              <strong style={{ fontFamily: 'monospace' }}>{currentLon.toFixed(5)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{isCancelled ? 'Última coordenada guardada:' : 'Última señal:'}</span>
              <span style={{ color: isCancelled ? '#fbbf24' : '#4ade80', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                {lastUpdate}
              </span>
            </div>

            <div style={{
              fontSize: '11px',
              color: isCancelled ? '#fca5a5' : 'var(--text-dim)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '6px',
            }}>
              {isCancelled
                ? '⏹️ El usuario canceló la transmisión. Esta última coordenada quedó guardada en el sistema.'
                : '📡 Coordenadas recibidas cada 5s directamente desde el sensor GPS del dispositivo móvil.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
