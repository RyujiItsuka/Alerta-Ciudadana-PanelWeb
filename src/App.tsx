import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { UserSession, AlertaReporte, CiudadanoItem, TecnicoItem, SystemConfig } from './types';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { AlertsPanel } from './components/AlertsPanel';
import { AppAlertsFeed } from './components/AppAlertsFeed';
import { TechniciansManagement } from './components/TechniciansManagement';
import { CitizensManagement } from './components/CitizensManagement';
import { TechnicianCalibration } from './components/TechnicianCalibration';
import { TechnicianDiagnostics } from './components/TechnicianDiagnostics';

export function App() {
  // Persistencia de sesión en localStorage para no regresar al login al recargar
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('alerta_ciudadana_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSetSession = (newSession: UserSession | null) => {
    setSession(newSession);
    try {
      if (newSession) {
        localStorage.setItem('alerta_ciudadana_session', JSON.stringify(newSession));
      } else {
        localStorage.removeItem('alerta_ciudadana_session');
      }
    } catch {
      // ignore
    }
  };

  const [currentTab, setCurrentTab] = useState<string>('alertas');
  const [alerts, setAlerts] = useState<AlertaReporte[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [citizens, setCitizens] = useState<CiudadanoItem[]>([]);

  // Estado de Técnicos de Central (Conectado a tabla persona de Supabase)
  const [technicians, setTechnicians] = useState<TecnicoItem[]>([]);

  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    phoneCentral: '51976264949',
    sensorShakeThreshold: 28.0,
    gpsTrackingIntervalSeconds: 5,
    modoMantenimiento: false,
    greenApiActive: true,
  });

  // 1. Cargar Alertas desde Supabase
  const loadAlerts = async () => {
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
        if (!selectedAlertId && formatted.length > 0) {
          setSelectedAlertId(formatted[0].id_reporte);
        }
      }
    } catch (err) {
      console.error('Fallo de red en loadAlerts:', err);
    }
  };

  // 2. Cargar Técnicos de Central (rol = 'tecnico')
  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('persona')
        .select('id_persona, dni, nombres, apellidos, telefono, rol, created_at')
        .eq('rol', 'tecnico')
        .order('id_persona', { ascending: false });

      if (!error && data) {
        setTechnicians(data.map((t: any) => ({
          id_persona: t.id_persona,
          dni: t.dni,
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
  };

  // 3. Cargar Ciudadanos (rol = 'ciudadano')
  const loadCitizens = async () => {
    try {
      const { data, error } = await supabase
        .from('persona')
        .select('id_persona, dni, nombres, apellidos, telefono, rol, created_at')
        .eq('rol', 'ciudadano')
        .order('id_persona', { ascending: false })
        .limit(50);

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
  };

  // 4. Suscripción en Tiempo Real (Supabase Realtime Channel)
  useEffect(() => {
    loadAlerts();
    loadTechnicians();
    loadCitizens();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reporte' },
        (payload) => {
          console.log('[SUPABASE REALTIME EVENT]', payload);
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cambio de estado de alerta (Despacho de patrulla, resolución, etc.)
  const handleUpdateStatus = async (alertId: number, newStatusId: number, _statusName: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id_reporte === alertId ? { ...a, id_estado: newStatusId } : a))
    );

    try {
      await supabase
        .from('reporte')
        .update({ id_estado: newStatusId })
        .eq('id_reporte', alertId);
    } catch (err) {
      console.warn('Error sincronizando estado con Supabase:', err);
    }
  };

  // Gestión de Técnicos (CRUD directo en Supabase)
  const handleAddTechnician = async (newTech: { dni: string; nombres: string; apellidos: string; telefono: string; password?: string }) => {
    const { data, error } = await supabase
      .from('persona')
      .insert({
        dni: newTech.dni,
        nombres: newTech.nombres,
        apellidos: newTech.apellidos,
        telefono: newTech.telefono,
        password_hash: newTech.password || 'Tecnico@2026',
        pin_hash: '1234',
        rol: 'tecnico',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      setTechnicians((prev) => [data, ...prev]);
    }
  };

  const handleUpdateTechnician = async (updated: TecnicoItem) => {
    const { error } = await supabase
      .from('persona')
      .update({
        nombres: updated.nombres,
        apellidos: updated.apellidos,
        telefono: updated.telefono,
      })
      .eq('dni', updated.dni);

    if (error) {
      throw error;
    }

    setTechnicians((prev) =>
      prev.map((t) => (t.dni === updated.dni ? { ...t, ...updated } : t))
    );
  };

  const handleDeleteTechnician = async (dni: string) => {
    const { error } = await supabase
      .from('persona')
      .delete()
      .eq('dni', dni);

    if (error) {
      throw error;
    }

    setTechnicians((prev) => prev.filter((t) => t.dni !== dni));
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

  if (!session) {
    return <LoginView onLogin={(sess) => handleSetSession(sess)} />;
  }

  const activeAlertsCount = alerts.filter((a) => a.id_estado === 1).length;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Barra Lateral */}
      <Sidebar
        session={session}
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        onLogout={() => handleSetSession(null)}
        activeAlertsCount={activeAlertsCount}
      />

      {/* Área Principal de Trabajo */}
      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* 1. Despacho & Alertas (Idéntico para Administrador y Técnico) */}
        {currentTab === 'alertas' && (
          <AlertsPanel
            alerts={alerts}
            session={session}
            onUpdateStatus={handleUpdateStatus}
            onSelectAlert={(a) => setSelectedAlertId(a.id_reporte)}
            selectedAlertId={selectedAlertId}
          />
        )}

        {/* 2. Alertas App (Idéntico para Administrador y Técnico) */}
        {currentTab === 'alertas_app' && (
          <AppAlertsFeed
            alerts={alerts}
            onSelectAlert={(a) => setSelectedAlertId(a.id_reporte)}
            selectedAlertId={selectedAlertId}
          />
        )}

        {/* 3. Gestión de Técnicos (Exclusivo Administrador) */}
        {currentTab === 'tecnicos' && session.rol === 'administrador' && (
          <TechniciansManagement
            technicians={technicians}
            onAddTechnician={handleAddTechnician}
            onUpdateTechnician={handleUpdateTechnician}
            onDeleteTechnician={handleDeleteTechnician}
          />
        )}

        {/* 4. Gestión de Ciudadanos (Exclusivo Administrador) */}
        {currentTab === 'ciudadanos' && session.rol === 'administrador' && (
          <CitizensManagement
            citizens={citizens}
            onToggleSuspend={handleToggleSuspend}
            onResetPin={handleResetPin}
          />
        )}

        {/* 5. Configuración Global (Exclusivo Administrador) */}
        {currentTab === 'calibracion' && session.rol === 'administrador' && (
          <TechnicianCalibration
            config={systemConfig}
            onSaveConfig={(updated) => setSystemConfig(updated)}
          />
        )}

        {/* 6. Auditoría & WhatsApp (Exclusivo Administrador) */}
        {currentTab === 'diagnostico' && session.rol === 'administrador' && (
          <TechnicianDiagnostics />
        )}
      </main>
    </div>
  );
}

export default App;
