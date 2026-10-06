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
  X
} from 'lucide-react';
import type { UserSession } from '../types';

interface SidebarProps {
  session: UserSession;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  activeAlertsCount: number;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  currentTab,
  onTabChange,
  onLogout,
  activeAlertsCount,
  onCloseMobile,
}) => {
  const isAdmin = session.rol === 'administrador';

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
          background: isAdmin ? '#dc2626' : '#0284c7',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isAdmin ? '0 0 15px rgba(220,38,38,0.5)' : '0 0 15px rgba(2,132,199,0.5)',
        }}>
          {isAdmin ? <ShieldAlert size={22} /> : <UserCheck size={22} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'white', lineHeight: '1.2' }}>
            ALERTA CIUDADANA
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isAdmin ? 'Mando & Admin Total' : 'Técnico de Central'}
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
            background: isAdmin ? '#ef4444' : '#38bdf8',
            boxShadow: `0 0 8px ${isAdmin ? '#ef4444' : '#38bdf8'}`,
          }} />
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: isAdmin ? '#fca5a5' : '#7dd3fc',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {isAdmin ? 'ADMINISTRADOR (TOTAL)' : 'TÉCNICO DE CENTRAL'}
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
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {/* 1. Despacho & Alertas (Idéntico para ambos) */}
        <button
          onClick={() => onTabChange('alertas')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: '8px',
            border: 'none',
            background: currentTab === 'alertas' ? (isAdmin ? '#dc2626' : '#0284c7') : 'transparent',
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

        {/* 2. Alertas App (Idéntico para ambos) */}
        <button
          onClick={() => onTabChange('alertas_app')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            borderRadius: '8px',
            border: 'none',
            background: currentTab === 'alertas_app' ? (isAdmin ? '#dc2626' : '#0284c7') : 'transparent',
            color: currentTab === 'alertas_app' ? 'white' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <BellRing size={18} />
          <span>Alertas App</span>
        </button>

        {/* Pestañas Exclusivas del Administrador */}
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
                background: currentTab === 'tecnicos' ? '#dc2626' : 'transparent',
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
                background: currentTab === 'ciudadanos' ? '#dc2626' : 'transparent',
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
              onClick={() => onTabChange('calibracion')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: 'none',
                background: currentTab === 'calibracion' ? '#dc2626' : 'transparent',
                color: currentTab === 'calibracion' ? 'white' : 'var(--text-muted)',
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
                background: currentTab === 'diagnostico' ? '#dc2626' : 'transparent',
                color: currentTab === 'diagnostico' ? 'white' : 'var(--text-muted)',
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
      </nav>

      {/* Logout Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
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
