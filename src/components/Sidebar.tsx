import React from 'react';
import { 
  Radio, 
  Users, 
  Sliders, 
  Activity, 
  LogOut, 
  ShieldAlert,
  BellRing,
  UserCheck,
  UserCog,
  ShieldCheck,
  Crown,
  Server,
  X,
  Volume2,
  VolumeX,
  BookOpen
} from 'lucide-react';
import type { UserSession } from '../types';

interface SidebarProps {
  session: UserSession;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  activeAlertsCount: number;
  onCloseMobile?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  currentTab,
  onTabChange,
  onLogout,
  activeAlertsCount,
  onCloseMobile,
  soundEnabled = true,
  onToggleSound,
}) => {
  const isSuperAdmin = session.rol === 'superadmin';
  const isAdmin = session.rol === 'administrador';

  // Tema de color según el rol
  const themeColor = isSuperAdmin ? '#f59e0b' : isAdmin ? '#dc2626' : '#0284c7';
  const themeBgActive = isSuperAdmin ? '#f59e0b' : isAdmin ? '#dc2626' : '#0284c7';

  return (
    <aside style={{
      width: '280px',
      background: 'rgba(12, 17, 29, 0.98)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          padding: '10px',
          borderRadius: '12px',
          background: themeColor,
          color: isSuperAdmin ? '#000000' : 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 15px ${isSuperAdmin ? 'rgba(245,158,11,0.5)' : isAdmin ? 'rgba(220,38,38,0.5)' : 'rgba(2,132,199,0.5)'}`,
        }}>
          {isSuperAdmin ? <Crown size={22} /> : isAdmin ? <ShieldAlert size={22} /> : <UserCheck size={22} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'white', lineHeight: '1.2' }}>
            ALERTA CIUDADANA
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isSuperAdmin ? 'Superusuario' : isAdmin ? 'Administración Central' : 'Técnico de Central'}
          </span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="mobile-close-btn"
            aria-label="Cerrar menú lateral"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* User Badge */}
      <div style={{
        padding: '16px 20px',
        margin: '16px 12px',
        borderRadius: '10px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-color)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: themeColor,
            boxShadow: `0 0 8px ${themeColor}`,
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: isSuperAdmin ? '#fde68a' : isAdmin ? '#fca5a5' : '#7dd3fc',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {isSuperAdmin ? 'SUPERADMINISTRADOR' : isAdmin ? 'ADMINISTRADOR' : 'TÉCNICO DE CENTRAL'}
          </span>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginTop: '4px' }}>
          {session.nombre}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
          {session.cargo}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        
        {/* MENÚ OPERATIVO (Solo para Administradores Municipales y Técnicos de Cámaras) */}
        {!isSuperAdmin && (
          <>
            <button
              onClick={() => onTabChange('alertas')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'alertas' ? themeBgActive : 'transparent',
                color: currentTab === 'alertas' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Radio size={18} />
                <span>Despacho & Alertas</span>
              </div>
              {activeAlertsCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 7px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  animation: 'pulse-dot 1.5s infinite',
                }}>
                  {activeAlertsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('alertas_app')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'alertas_app' ? themeBgActive : 'transparent',
                color: currentTab === 'alertas_app' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <BellRing size={18} />
              <span>Historial de Alertas</span>
            </button>

            {/* Catálogo de Servicios: visible solo para el TÉCNICO. El
                administrador lo ve en su propio bloque (isAdmin), que está
                más abajo. Sin esta condición, un administrador cumple
                `!isSuperAdmin` y también `isAdmin`, y el ítem se le
                duplicaba en el menú. */}
            {!isAdmin && (
              <button
                onClick={() => onTabChange('soporte')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentTab === 'soporte' ? themeBgActive : 'transparent',
                  color: currentTab === 'soporte' ? 'white' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <BookOpen size={18} />
                <span>Catálogo de Servicios</span>
              </button>
            )}
          </>
        )}

        {/* MENÚ DE SUPERADMINISTRADOR */}
        {isSuperAdmin && (
          <>
            <button
              onClick={() => onTabChange('dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'dashboard' ? '#f59e0b' : 'transparent',
                color: currentTab === 'dashboard' ? '#000000' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Server size={18} />
              <span>Estado del Sistema</span>
            </button>

            <button
              onClick={() => onTabChange('administradores')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'administradores' ? '#f59e0b' : 'transparent',
                color: currentTab === 'administradores' ? '#000000' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <ShieldCheck size={18} />
              <span>Gestión de Administradores</span>
            </button>

            <button
              onClick={() => onTabChange('tecnicos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'tecnicos' ? '#f59e0b' : 'transparent',
                color: currentTab === 'tecnicos' ? '#000000' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <UserCog size={18} />
              <span>Gestión de Técnicos</span>
            </button>

            <button
              onClick={() => onTabChange('ciudadanos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'ciudadanos' ? '#f59e0b' : 'transparent',
                color: currentTab === 'ciudadanos' ? '#000000' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Users size={18} />
              <span>Gestión de Ciudadanos</span>
            </button>

            <button
              onClick={() => onTabChange('calibracion')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'calibracion' ? '#f59e0b' : 'transparent',
                color: currentTab === 'calibracion' ? '#000000' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Sliders size={18} />
              <span>Configuración Global</span>
            </button>

            <button
              onClick={() => onTabChange('diagnostico')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'diagnostico' ? '#f59e0b' : 'transparent',
                color: currentTab === 'diagnostico' ? '#000000' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Activity size={18} />
              <span>Auditoría & WhatsApp</span>
            </button>
          </>
        )}

        {/* TÉCNICOS & CIUDADANOS PARA ADMINISTRADOR MUNICIPAL */}
        {isAdmin && (
          <>
            <button
              onClick={() => onTabChange('tecnicos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'tecnicos' ? themeBgActive : 'transparent',
                color: currentTab === 'tecnicos' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <UserCog size={18} />
              <span>Gestión de Técnicos</span>
            </button>

            <button
              onClick={() => onTabChange('ciudadanos')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'ciudadanos' ? themeBgActive : 'transparent',
                color: currentTab === 'ciudadanos' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <Users size={18} />
              <span>Gestión de Ciudadanos</span>
            </button>

            <button
              onClick={() => onTabChange('soporte')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'soporte' ? themeBgActive : 'transparent',
                color: currentTab === 'soporte' ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <BookOpen size={18} />
              <span>Catálogo de Servicios</span>
            </button>
          </>
        )}
      </nav>

      {/* Sound Toggle & Logout Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {onToggleSound && (
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Silenciar alarma sonora' : 'Activar alarma sonora'}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '8px',
              border: `1px solid ${soundEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.08)'}`,
              background: soundEnabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.2)',
              color: soundEnabled ? '#34d399' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span>Alarma Sonora ({soundEnabled ? 'Activa' : 'Silenciada'})</span>
            </div>
            <span style={{ fontSize: '10px', opacity: 0.8 }}>alerta.mp3</span>
          </button>
        )}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(0,0,0,0.2)',
            color: 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <LogOut size={16} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
