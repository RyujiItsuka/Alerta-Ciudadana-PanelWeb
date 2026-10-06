import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Phone, 
  ShieldCheck,
  X,
  Save,
  Key
} from 'lucide-react';
import type { TecnicoItem } from '../types';

interface TechniciansManagementProps {
  technicians: TecnicoItem[];
  onAddTechnician: (tecnico: { usuario: string; nombres: string; apellidos: string; telefono: string; password?: string }) => Promise<void>;
  onUpdateTechnician: (tecnico: TecnicoItem) => Promise<void>;
  onDeleteTechnician: (usuario: string) => Promise<void>;
}

export const TechniciansManagement: React.FC<TechniciansManagementProps> = ({
  technicians,
  onAddTechnician,
  onUpdateTechnician,
  onDeleteTechnician,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTech, setEditingTech] = useState<TecnicoItem | null>(null);

  // Campos de formulario
  const [usuario, setUsuario] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const openNewModal = () => {
    setEditingTech(null);
    setUsuario('');
    setNombres('');
    setApellidos('');
    setTelefono('');
    setPassword('Tecnico@2026');
    setShowModal(true);
  };

  const openEditModal = (tech: TecnicoItem) => {
    setEditingTech(tech);
    setUsuario(tech.usuario || '');
    setNombres(tech.nombres);
    setApellidos(tech.apellidos);
    setTelefono(tech.telefono);
    setPassword('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !nombres || !apellidos || !telefono) {
      alert('Por favor complete los campos obligatorios (Usuario, nombres, apellidos, teléfono)');
      return;
    }

    setSaving(true);
    try {
      if (editingTech) {
        await onUpdateTechnician({
          ...editingTech,
          usuario,
          nombres,
          apellidos,
          telefono,
        });
      } else {
        await onAddTechnician({
          usuario: usuario.trim().toLowerCase(),
          nombres,
          apellidos,
          telefono,
          password: password || 'Tecnico@2026',
        });
      }
      setShowModal(false);
    } catch (err: any) {
      alert(`Error al guardar técnico: ${err.message || 'Error de base de datos'}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = technicians.filter((t) => {
    const q = searchTerm.toLowerCase();
    const u = (t.usuario || '').toLowerCase();
    return (
      u.includes(q) ||
      t.nombres.toLowerCase().includes(q) ||
      t.apellidos.toLowerCase().includes(q) ||
      t.telefono.includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header Bar */}
      <div className="responsive-topbar">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Users size={20} />
            Gestión de Técnicos de Central (Tabla operador_central - Supabase)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Personal autorizado con rol 'tecnico' para acceder al panel web de monitoreo
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '480px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <input
              type="text"
              placeholder="Buscar por Usuario o Nombre..."
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

          <button
            onClick={openNewModal}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(239,68,68,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <UserPlus size={16} />
            Registrar Técnico
          </button>
        </div>
      </div>

      {/* Tabla de Técnicos */}
      <div className="glass-panel table-responsive-wrapper" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Usuario</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Técnico</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Teléfono</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Rol en BD</th>
              <th style={{ padding: '12px 14px', fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron técnicos registrados en la base de datos con rol 'tecnico'.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.usuario || t.id_operador} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 800, color: '#38bdf8' }}>
                    {t.usuario}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, color: 'white' }}>{t.nombres} {t.apellidos}</div>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="#10b981" />
                      +51 {t.telefono}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: 'rgba(2,132,199,0.2)',
                      color: '#38bdf8',
                      textTransform: 'uppercase'
                    }}>
                      {t.rol}
                    </span>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEditModal(t)}
                        title="Modificar datos del técnico"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(56,189,248,0.3)',
                          background: 'rgba(56,189,248,0.1)',
                          color: '#38bdf8',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Edit3 size={13} />
                        Editar
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar al técnico ${t.nombres} ${t.apellidos} (Usuario: ${t.usuario})?`)) {
                            onDeleteTechnician(t.usuario);
                          }
                        }}
                        title="Eliminar técnico"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239,68,68,0.3)',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#f87171',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={13} />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: Agregar / Modificar Técnico */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#ef4444" />
                {editingTech ? 'Modificar Datos de Técnico' : 'Registrar Nuevo Técnico (BD Supabase)'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Usuario de Acceso *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTech}
                    placeholder="ej. tec_salcedo"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value.toLowerCase().trim())}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Teléfono *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="9 dígitos"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombres completos"
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Apellidos"
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {!editingTech && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Contraseña Inicial para el Técnico *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      required
                      placeholder="Contraseña de acceso"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px 8px 34px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'rgba(0,0,0,0.4)',
                        color: '#38bdf8',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <Key size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#ef4444',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: saving ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Guardando en BD...' : (editingTech ? 'Guardar Cambios' : 'Registrar en Supabase')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
