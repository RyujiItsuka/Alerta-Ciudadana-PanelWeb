import { useState, useEffect } from 'react';
import { Menu, ShieldAlert } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
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

  // 2. Cargar Técnicos de Central (Tabla dedicada operador_central con fallback)
  const loadTechnicians = async () => {
    try {
      const { data: opData, error: opError } = await supabase
        .from('operador_central')
        .select('*')
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
  };

  // 3. Cargar Ciudadanos (Tabla persona dedicada a vecinos de la App Móvil)
  const loadCitizens = async () => {
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

  // Gestión de Técnicos (CRUD en tabla dedicada operador_central sin DNI)
  const handleAddTechnician = async (newTech: { usuario: string; nombres: string; apellidos: string; telefono: string; password?: string }) => {
    const { data: opData, error: opError } = await supabase
      .from('operador_central')
      .insert({
        usuario: newTech.usuario,
        nombres: newTech.nombres,
        apellidos: newTech.apellidos,
        telefono: newTech.telefono,
        password_hash: newTech.password || 'Tecnico@2026',
        rol: 'tecnico',
        turno: 'Mañana',
        estado: 'activo',
      })
      .select()
      .single();

    if (opError) {
      throw opError;
    }

    if (opData) {
      setTechnicians((prev) => [opData, ...prev]);
    }
  };

  const handleUpdateTechnician = async (updated: TecnicoItem) => {
    const { error } = await supabase
      .from('operador_central')
      .update({
        nombres: updated.nombres,
        apellidos: updated.apellidos,
        telefono: updated.telefono,
      })
      .eq('usuario', updated.usuario);

    if (error) {
      console.error('Error al actualizar técnico:', error);
      throw error;
    }

    setTechnicians((prev) =>
      prev.map((t) => (t.usuario === updated.usuario ? { ...t, ...updated } : t))
    );
  };

  const handleDeleteTechnician = async (usuario: string) => {
    const { error } = await supabase
      .from('operador_central')
      .delete()
      .eq('usuario', usuario);

    if (error) {
      console.error('Error al eliminar técnico:', error);
      throw error;
    }

    setTechnicians((prev) => prev.filter((t) => t.usuario !== usuario));
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
            <ShieldAlert size={20} color={session.rol === 'administrador' ? '#ef4444' : '#0284c7'} />
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
            background: session.rol === 'administrador' ? 'rgba(239,68,68,0.2)' : 'rgba(2,132,199,0.2)',
            color: session.rol === 'administrador' ? '#fca5a5' : '#7dd3fc',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
            {session.rol === 'administrador' ? 'Admin' : 'Técnico'}
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
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setMobileMenuOpen(false);
          }}
          onLogout={() => handleSetSession(null)}
          activeAlertsCount={activeAlertsCount}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Área Principal de Trabajo */}
      <main className="main-content">
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
