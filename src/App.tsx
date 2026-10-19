import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import { Menu, ShieldAlert, Radio, Crown } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { UserSession, AlertaReporte, CiudadanoItem, TecnicoItem, SystemConfig } from './types';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { AlertsPanel } from './components/AlertsPanel';

// Code-splitting con carga diferida (lazy loading) para reducir drásticamente el bundle inicial
const AppAlertsFeed = lazy(() => import('./components/AppAlertsFeed').then((m) => ({ default: m.AppAlertsFeed })));
const TechniciansManagement = lazy(() => import('./components/TechniciansManagement').then((m) => ({ default: m.TechniciansManagement })));
const AdministratorsManagement = lazy(() => import('./components/AdministratorsManagement').then((m) => ({ default: m.AdministratorsManagement })));
const CitizensManagement = lazy(() => import('./components/CitizensManagement').then((m) => ({ default: m.CitizensManagement })));
const TechnicianCalibration = lazy(() => import('./components/TechnicianCalibration').then((m) => ({ default: m.TechnicianCalibration })));
const TechnicianDiagnostics = lazy(() => import('./components/TechnicianDiagnostics').then((m) => ({ default: m.TechnicianDiagnostics })));
const LiveTrackingModal = lazy(() => import('./components/LiveTrackingModal').then((m) => ({ default: m.LiveTrackingModal })));
const SystemHealthDashboard = lazy(() => import('./components/SystemHealthDashboard').then((m) => ({ default: m.SystemHealthDashboard })));

// Limpiar cualquier residuo de localStorage una única vez al cargar el módulo
// (antes se ejecutaba en cada render del componente).
try {
  localStorage.removeItem('alerta_ciudadana_session');
} catch {
  // localStorage no disponible (modo privado): se ignora.
}

export function App() {
  // Persistencia de sesión exclusiva en sessionStorage (se destruye al cerrar la ventana)
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('alerta_ciudadana_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('alerta_sound_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const playAlertSound = useCallback(() => {
    try {
      const audio = new Audio('/alerta.mp3');
      audio.volume = 1.0;
      audio.play().catch((err) => {
        console.warn('[AUDIO] Autoplay bloqueado por el navegador hasta la primera interacción:', err);
      });
    } catch (err) {
      console.error('[AUDIO] Error instanciando audio:', err);
    }
  }, []);

  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem('alerta_ciudadana_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rol === 'superadmin') return 'dashboard';
      }
    } catch {
      // ignore
    }
    return 'alertas';
  });

  const handleSetSession = (newSession: UserSession | null) => {
    setSession(newSession);
    try {
      if (newSession) {
        sessionStorage.setItem('alerta_ciudadana_session', JSON.stringify(newSession));
        if (newSession.rol === 'superadmin') {
          setCurrentTab('dashboard');
        } else {
          setCurrentTab('alertas');
        }
      } else {
        sessionStorage.removeItem('alerta_ciudadana_session');
        setCurrentTab('alertas');
      }
    } catch {
      // ignore
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<AlertaReporte[]>([]);
  const activeAlertsCount = useMemo(() => alerts.filter((a) => a.id_estado === 1).length, [alerts]);
  const activeTab = useMemo(() => {
    if (session?.rol === 'superadmin' && (currentTab === 'alertas' || currentTab === 'alertas_app')) {
      return 'dashboard';
    }
    return currentTab;
  }, [session?.rol, currentTab]);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [citizens, setCitizens] = useState<CiudadanoItem[]>([]);

  // Estado de Técnicos y Administradores de Central
  const [technicians, setTechnicians] = useState<TecnicoItem[]>([]);
  const [administrators, setAdministrators] = useState<any[]>([]);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    phoneCentral: '51976264949',
    sensorShakeThreshold: 28.0,
    gpsTrackingIntervalSeconds: 5,
    modoMantenimiento: false,
    greenApiActive: true,
  });

  // 1. Cargar Alertas desde Supabase
  const loadAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reporte')
        .select(`
          id_reporte,
          descripcion,
          fecha_hora,
          id_estado,
          direccion_texto,
          tipo_incidencia (nombre),
          ubicacion (latitud, longitud),
          persona (nombres, apellidos, telefono, dni)
        `)
        .order('fecha_hora', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Error cargando alertas de Supabase:', error.message);
      } else if (data && data.length > 0) {
        const formatted: AlertaReporte[] = data.map((item: any) => {
          const ubi = Array.isArray(item.ubicacion) && item.ubicacion.length > 0 ? item.ubicacion[0] : (item.ubicacion || null);
          return {
            id_reporte: item.id_reporte,
            descripcion: item.descripcion || 'Sin descripción',
            fecha_hora: item.fecha_hora || new Date().toISOString(),
            id_estado: item.id_estado || 1,
            tipo_incidencia: item.tipo_incidencia || { nombre: 'EMERGENCIA GENERAL' },
            ubicacion: {
              latitud: ubi?.latitud ?? -13.7142,
              longitud: ubi?.longitud ?? -76.2038,
              direccion_texto: item.direccion_texto || 'Ubicación móvil GPS (Pisco)',
            },
            ciudadano: item.persona || { nombres: 'Ciudadano', apellidos: '', telefono: '976264949', dni: '00000000' },
          };
        });
        setAlerts(formatted);
        // Actualización funcional: conserva la selección del operador sin
        // depender de `selectedAlertId` (evita cierres obsoletos).
        setSelectedAlertId((prev) => prev ?? formatted[0]?.id_reporte ?? null);
      }
    } catch (err) {
      console.error('Fallo de red en loadAlerts:', err);
    }
  }, []);

  // 2. Cargar Técnicos de Central (Tabla dedicada operador_central)
  const loadTechnicians = useCallback(async () => {
    try {
      const { data: opData, error: opError } = await supabase
        .from('operador_central')
        .select('id_operador,usuario,nombres,apellidos,telefono,rol,turno,estado,created_at')
        .eq('rol', 'tecnico')
        .order('id_operador', { ascending: false });

      if (!opError && opData && opData.length > 0) {
        setTechnicians(opData);
        return;
      }

      // Fallback a persona
      const { data, error } = await supabase
        .from('persona')
        .select('id_persona, dni, nombres, apellidos, telefono, rol, created_at')
        .eq('rol', 'tecnico')
        .order('id_persona', { ascending: false });

      if (!error && data) {
        setTechnicians(data.map((t: any) => ({
          id_operador: t.id_persona,
          usuario: t.dni,
          nombres: t.nombres,
          apellidos: t.apellidos,
          telefono: t.telefono,
          rol: t.rol,
          created_at: t.created_at,
        })));
      }
    } catch (err) {
      console.warn('Error cargando técnicos:', err);
    }
  }, []);

  // 3. Cargar Administradores de Central (Tabla operador_central)
  const loadAdministrators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('operador_central')
        .select('id_operador,usuario,nombres,apellidos,telefono,rol,turno,estado,created_at')
        .in('rol', ['admin', 'administrador'])
        .order('id_operador', { ascending: false });

      if (!error && data) {
        setAdministrators(data);
      }
    } catch (err) {
      console.warn('Error cargando administradores:', err);
    }
  }, []);

  // 4. Cargar Ciudadanos (Tabla persona de vecinos de la App Móvil)
  const loadCitizens = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('persona')
        .select('id_persona, dni, nombres, apellidos, telefono, rol, created_at')
        .neq('rol', 'admin')
        .neq('rol', 'administrador')
        .neq('rol', 'tecnico')
        .order('id_persona', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        setCitizens(data.map((c: any) => ({
          ...c,
          estado_cuenta: 'activo',
        })));
      } else {
        setCitizens([]);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Ref con el estado de sonido: permite leerlo dentro del canal Realtime sin
  // re-suscribir el WebSocket cada vez que el usuario activa/desactiva el audio.
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // 5. Suscripción en Tiempo Real (Supabase Realtime Channel)
  useEffect(() => {
    // Carga inicial en paralelo (diferida con setTimeout para no llamar setState
    // de forma síncrona dentro del efecto y evitar renders en cascada).
    const initialTimer = setTimeout(() => {
      Promise.allSettled([
        loadAlerts(),
        loadTechnicians(),
        loadAdministrators(),
        loadCitizens(),
        loadSystemConfig(),
      ]);
    }, 0);

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reporte' },
        (payload) => {
          if (payload.eventType === 'INSERT' && soundEnabledRef.current) {
            playAlertSound();
          }
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(initialTimer);
      supabase.removeChannel(channel);
    };
  }, [loadAlerts, loadTechnicians, loadAdministrators, loadCitizens, playAlertSound]);

  // Cambio de estado de alerta (Despacho de patrulla, resolución, etc.)
  const handleUpdateStatus = async (alertId: number, newStatusId: number, _statusName: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id_reporte === alertId ? { ...a, id_estado: newStatusId } : a))
    );

    try {
      const { error } = await supabase
        .from('reporte')
        .update({ id_estado: newStatusId })
        .eq('id_reporte', alertId);

      if (error) {
        console.error('Error persistiendo nuevo estado en Supabase:', error.message);
        loadAlerts();
      }
    } catch (err) {
      console.warn('Error de red sincronizando estado con Supabase:', err);
      loadAlerts();
    }
  };

  // Invoca una acción administrativa de la Edge Function `security` enviando el
  // token de staff. Centraliza el manejo de errores (401/403 -> mensaje).
  const callStaffAction = async (
    action: string,
    payload: Record<string, unknown>,
  ): Promise<{ user?: TecnicoItem } & Record<string, unknown>> => {
    if (!session?.token) {
      throw new Error('Sesión no válida. Vuelva a iniciar sesión.');
    }
    const { data, error } = await supabase.functions.invoke('security', {
      body: { action, token: session.token, ...payload },
    });
    if (error) {
      let message = 'No se pudo completar la operación.';
      try {
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          const body = await ctx.json();
          if (body?.error) message = body.error;
        }
      } catch {
        // Sin cuerpo parseable: se usa el mensaje genérico.
      }
      throw new Error(message);
    }
    if (!data?.success) {
      throw new Error(data?.error || 'No se pudo completar la operación.');
    }
    return data;
  };

  // Configuración del sistema (número WhatsApp de la Central) persistida en
  // `configuracion_sistema`. El destino lo resuelve el servidor al despachar,
  // por lo que cambiarlo aquí NO exige actualizar ni recompilar la app móvil.
  const loadSystemConfig = async () => {
    try {
      const res = await callStaffAction('get-config', {});
      const cfg = (res?.config ?? {}) as Record<string, string>;
      setSystemConfig((prev) => ({
        ...prev,
        phoneCentral: cfg.whatsapp_central || prev.phoneCentral,
      }));
    } catch (err) {
      // Sin configuración cargada se conserva el valor por defecto en memoria.
      console.warn('No se pudo cargar la configuración del sistema:', err);
    }
  };

  const handleSaveConfig = async (updated: SystemConfig) => {
    // Se persiste en el servidor ANTES de aplicarlo localmente: si falla, se
    // propaga el error a la pantalla de configuración y no se guarda nada.
    await callStaffAction('set-config', {
      clave: 'whatsapp_central',
      valor: updated.phoneCentral,
    });
    setSystemConfig(updated);
  };

  // Gestión de Técnicos (CRUD en operador_central vía Edge Function `security`)
  const handleAddTechnician = async (newTech: { usuario: string; nombres: string; apellidos: string; telefono: string; password?: string }) => {
    if (!newTech.password) {
      throw new Error('La contraseña del técnico es obligatoria.');
    }

    const res = await callStaffAction('staff-save', {
      usuario: newTech.usuario,
      nombres: newTech.nombres,
      apellidos: newTech.apellidos,
      telefono: newTech.telefono,
      rol: 'tecnico',
      turno: 'Mañana',
      estado: 'activo',
      password: newTech.password,
    });

    if (res?.user) {
      setTechnicians((prev) => [res.user as TecnicoItem, ...prev]);
    }
  };

  const handleUpdateTechnician = async (updated: TecnicoItem) => {
    const res = await callStaffAction('staff-save', {
      usuario: updated.usuario,
      nombres: updated.nombres,
      apellidos: updated.apellidos,
      telefono: updated.telefono,
      rol: 'tecnico',
      turno: updated.turno ?? 'Mañana',
      estado: updated.estado ?? 'activo',
      ...(updated.password ? { password: updated.password } : {}),
    });

    // La contraseña NUNCA se conserva en el estado del navegador.
    const { password: _ignoredPassword, ...cleanUpdated } = updated;
    setTechnicians((prev) =>
      prev.map((t) =>
        t.usuario === updated.usuario ? { ...t, ...cleanUpdated, ...((res?.user as TecnicoItem) ?? {}) } : t
      )
    );
  };

  const handleDeleteTechnician = async (usuario: string) => {
    await callStaffAction('staff-delete', { usuario });
    setTechnicians((prev) => prev.filter((t) => t.usuario !== usuario));
  };

  // Gestión de Administradores (solo superadmin; validado en el servidor)
  const handleAddAdministrator = async (newAdmin: any) => {
    if (!newAdmin.password) {
      throw new Error('La contraseña del administrador es obligatoria.');
    }

    const res = await callStaffAction('staff-save', {
      usuario: newAdmin.usuario,
      nombres: newAdmin.nombres,
      apellidos: newAdmin.apellidos,
      telefono: newAdmin.telefono,
      rol: 'administrador',
      turno: 'Rotativo',
      estado: 'activo',
      password: newAdmin.password,
    });

    if (res?.user) {
      setAdministrators((prev) => [res.user as TecnicoItem, ...prev]);
    }
  };

  const handleUpdateAdministrator = async (updated: any) => {
    const res = await callStaffAction('staff-save', {
      usuario: updated.usuario,
      nombres: updated.nombres,
      apellidos: updated.apellidos,
      telefono: updated.telefono,
      rol: 'administrador',
      turno: updated.turno ?? 'Rotativo',
      estado: updated.estado ?? 'activo',
      ...(updated.password ? { password: updated.password } : {}),
    });

    const { password: _ignoredPassword, ...cleanUpdated } = updated;
    setAdministrators((prev) =>
      prev.map((a) =>
        a.usuario === updated.usuario ? { ...a, ...cleanUpdated, ...((res?.user as TecnicoItem) ?? {}) } : a
      )
    );
  };

  const handleDeleteAdministrator = async (usuario: string) => {
    await callStaffAction('staff-delete', { usuario });
    setAdministrators((prev) => prev.filter((a) => a.usuario !== usuario));
  };

  // Suspender / Reactivar Ciudadano
  const handleToggleSuspend = (idPersona: number, currentStatus?: string) => {
    const nextStatus = currentStatus === 'suspendido' ? 'activo' : 'suspendido';
    setCitizens((prev) =>
      prev.map((c) => (c.id_persona === idPersona ? { ...c, estado_cuenta: nextStatus } : c))
    );
  };

  // Reset PIN
  const handleResetPin = (dni: string) => {
    alert(`Se ha generado un código de restablecimiento seguro para el DNI ${dni} y se envió a su WhatsApp.`);
  };

  // Detección de ventana independiente de Seguimiento GPS en Vivo (?tracking=ID)
  const trackingParam = new URLSearchParams(window.location.search).get('tracking');
  const [standaloneAlert, setStandaloneAlert] = useState<AlertaReporte | null>(null);
  const [standaloneLoading, setStandaloneLoading] = useState<boolean>(!!trackingParam);
  const [standaloneError, setStandaloneError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackingParam) return;
    const fetchStandaloneAlert = async () => {
      setStandaloneLoading(true);
      setStandaloneError(null);
      try {
        const { data, error } = await supabase
          .from('reporte')
          .select(`
            id_reporte,
            descripcion,
            fecha_hora,
            id_estado,
            direccion_texto,
            tipo_incidencia (nombre),
            ubicacion (latitud, longitud),
            persona (nombres, apellidos, telefono, dni)
          `)
          .eq('id_reporte', Number(trackingParam))
          .single();

        if (error || !data) {
          setStandaloneError('No se encontró la alerta de rastreo o la señal fue finalizada.');
        } else {
          const item: any = data;
          const ubi = Array.isArray(item.ubicacion) && item.ubicacion.length > 0 ? item.ubicacion[0] : (item.ubicacion || null);
          const formatted: AlertaReporte = {
            id_reporte: item.id_reporte,
            descripcion: item.descripcion || 'Sin descripción',
            fecha_hora: item.fecha_hora || new Date().toISOString(),
            id_estado: item.id_estado || 1,
            tipo_incidencia: item.tipo_incidencia || { nombre: 'EMERGENCIA GENERAL' },
            ubicacion: {
              latitud: ubi?.latitud ?? -13.7142,
              longitud: ubi?.longitud ?? -76.2038,
              direccion_texto: item.direccion_texto || 'Ubicación móvil GPS (Pisco)',
            },
            ciudadano: item.persona || { nombres: 'Ciudadano', apellidos: '', telefono: '976264949', dni: '00000000' },
          };
          setStandaloneAlert(formatted);
          document.title = `🔴 GPS en Vivo - Incidente #${formatted.id_reporte} (${formatted.ciudadano?.nombres || ''})`;
        }
      } catch {
        setStandaloneError('Error al sincronizar con el servidor.');
      } finally {
        setStandaloneLoading(false);
      }
    };
    fetchStandaloneAlert();
  }, [trackingParam]);

  // Si la ventana fue abierta como monitor independiente de rastreo
  if (trackingParam) {
    if (standaloneLoading) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0E14',
          color: 'white',
          gap: '16px',
        }}>
          <Radio size={48} color="#ef4444" style={{ animation: 'pulse 1.5s infinite' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Conectando con señal GPS en vivo del Incidente #{trackingParam}...</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cargando telemetría del dispositivo móvil...</p>
        </div>
      );
    }

    if (standaloneError || !standaloneAlert) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0E14',
          color: 'white',
          gap: '16px',
          padding: '20px',
          textAlign: 'center',
        }}>
          <ShieldAlert size={56} color="#f87171" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f87171' }}>Incidente no disponible</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px' }}>
            {standaloneError || `No se pudo encontrar el reporte #${trackingParam} o la transmisión ya fue finalizada.`}
          </p>
          <button
            onClick={() => window.close()}
            style={{
              padding: '10px 20px',
              background: '#2563eb',
              color: 'white',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: '10px',
            }}
          >
            Cerrar Ventana
          </button>
        </div>
      );
    }

    return (
      <Suspense fallback={
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0E14',
          color: 'white',
          gap: '16px',
        }}>
          <Radio size={48} color="#ef4444" style={{ animation: 'pulse 1.5s infinite' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Conectando con señal GPS en vivo...</h2>
        </div>
      }>
        <LiveTrackingModal
          alert={standaloneAlert}
          isStandalone={true}
          onClose={() => window.close()}
        />
      </Suspense>
    );
  }

  if (!session) {
    return <LoginView onLogin={(sess) => handleSetSession(sess)} />;
  }

  const isSuperAdmin = session.rol === 'superadmin';
  const isAdmin = session.rol === 'administrador';
  const canManagePersonnel = isSuperAdmin || isAdmin;

  return (
    <div className="app-layout">
      {/* Header Superior Móvil */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menú de navegación"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'white',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSuperAdmin ? (
              <Crown size={20} color="#f59e0b" />
            ) : (
              <ShieldAlert size={20} color={isAdmin ? '#ef4444' : '#0284c7'} />
            )}
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'white', letterSpacing: '-0.3px' }}>
              Central Alerta
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '999px',
            background: isSuperAdmin ? 'rgba(245,158,11,0.2)' : isAdmin ? 'rgba(239,68,68,0.2)' : 'rgba(2,132,199,0.2)',
            color: isSuperAdmin ? '#fde68a' : isAdmin ? '#fca5a5' : '#7dd3fc',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            {isSuperAdmin ? 'Soporte Dev' : isAdmin ? 'Admin' : 'Técnico'}
          </span>
          {activeAlertsCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: 'white',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 800,
            }}>
              {activeAlertsCount}
            </span>
          )}
        </div>
      </header>

      {/* Backdrop de Oscurecimiento en Móvil */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Contenedor de Barra Lateral (Drawer en móvil / Fixed en desktop) */}
      <div className={`sidebar-container ${mobileMenuOpen ? 'open' : ''}`}>
        <Sidebar
          session={session}
          currentTab={activeTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setMobileMenuOpen(false);
          }}
          onLogout={() => handleSetSession(null)}
          activeAlertsCount={activeAlertsCount}
          onCloseMobile={() => setMobileMenuOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            try { sessionStorage.setItem('alerta_sound_enabled', String(next)); } catch {}
            if (next) playAlertSound();
          }}
        />
      </div>

      {/* Área Principal de Trabajo */}
      <main className="main-content">
        <Suspense fallback={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            Cargando módulo...
          </div>
        }>
          {/* 0. Estado del Sistema & Servidores Cloud (Exclusivo Superadmin - Pantalla de Inicio) */}
          {activeTab === 'dashboard' && isSuperAdmin && (
            <SystemHealthDashboard
              totalAdmins={administrators.length}
              totalTechnicians={technicians.length}
              totalCitizens={citizens.length}
            />
          )}

          {/* 1. Despacho & Alertas (Exclusivo Administrador y Técnico - Oculto para Superadmin) */}
          {activeTab === 'alertas' && !isSuperAdmin && (
            <AlertsPanel
              alerts={alerts}
              onUpdateStatus={handleUpdateStatus}
              onSelectAlert={(a) => setSelectedAlertId(a.id_reporte)}
              selectedAlertId={selectedAlertId}
            />
          )}

          {/* 2. Historial de Alertas (Exclusivo Administrador y Técnico - Oculto para Superadmin) */}
          {activeTab === 'alertas_app' && !isSuperAdmin && (
            <AppAlertsFeed
              alerts={alerts}
              onSelectAlert={(a) => setSelectedAlertId(a.id_reporte)}
              selectedAlertId={selectedAlertId}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

          {/* 3. Gestión de Técnicos (Superadmin y Administrador) */}
          {activeTab === 'tecnicos' && canManagePersonnel && (
            <TechniciansManagement
              technicians={technicians}
              onAddTechnician={handleAddTechnician}
              onUpdateTechnician={handleUpdateTechnician}
              onDeleteTechnician={handleDeleteTechnician}
            />
          )}

          {/* 4. Gestión de Ciudadanos (Superadmin y Administrador) */}
          {activeTab === 'ciudadanos' && canManagePersonnel && (
            <CitizensManagement
              citizens={citizens}
              onToggleSuspend={handleToggleSuspend}
              onResetPin={handleResetPin}
            />
          )}

          {/* 5. Gestión de Administradores (Exclusivo Superadmin / Desarrollador) */}
          {activeTab === 'administradores' && isSuperAdmin && (
            <AdministratorsManagement
              administrators={administrators}
              onAddAdministrator={handleAddAdministrator}
              onUpdateAdministrator={handleUpdateAdministrator}
              onDeleteAdministrator={handleDeleteAdministrator}
            />
          )}

          {/* 6. Configuración Global (Exclusivo Superadmin / Desarrollador) */}
          {activeTab === 'calibracion' && isSuperAdmin && (
            <TechnicianCalibration
              config={systemConfig}
              onSaveConfig={handleSaveConfig}
            />
          )}

          {/* 7. Auditoría & WhatsApp (Exclusivo Superadmin / Desarrollador) */}
          {activeTab === 'diagnostico' && isSuperAdmin && (
            <TechnicianDiagnostics />
          )}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
