import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Phone, 
  X,
  Save,
  Key,
  Lock,
  Crown
} from 'lucide-react';
import bcrypt from 'bcryptjs';
import type { TecnicoItem } from '../types';

interface AdministratorsManagementProps {
  administrators: TecnicoItem[];
  onAddAdministrator: (admin: { usuario: string; nombres: string; apellidos: string; telefono: string; password?: string }) => Promise<void>;
  onUpdateAdministrator: (admin: TecnicoItem) => Promise<void>;
  onDeleteAdministrator: (usuario: string) => Promise<void>;
}

export const AdministratorsManagement: React.FC<AdministratorsManagementProps> = ({
  administrators,
  onAddAdministrator,
  onUpdateAdministrator,
  onDeleteAdministrator,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<TecnicoItem | null>(null);

  // Campos de formulario
  const [usuario, setUsuario] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const openNewModal = () => {
    setEditingAdmin(null);
    setUsuario('');
    setNombres('');
    setApellidos('');
    setTelefono('');
    setPassword('Admin@Segura2026!');
    setShowModal(true);
  };

  const openEditModal = (admin: TecnicoItem) => {
    setEditingAdmin(admin);
    setUsuario(admin.usuario || '');
    setNombres(admin.nombres);
    setApellidos(admin.apellidos);
    setTelefono(admin.telefono);
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
      if (editingAdmin) {
        await onUpdateAdministrator({
          ...editingAdmin,
          usuario,
          nombres,
          apellidos,
          telefono,
          password: password ? bcrypt.hashSync(password, 10) : undefined,
        });
      } else {
        await onAddAdministrator({
          usuario: usuario.trim().toLowerCase(),
          nombres,
          apellidos,
          telefono,
          password: password ? bcrypt.hashSync(password, 10) : bcrypt.hashSync('Admin@Segura2026!', 10),
        });
      }
      setShowModal(false);
    } catch (err: any) {
      alert(`Error al guardar administrador: ${err.message || 'Error de base de datos'}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = administrators.filter((a) => {
    const q = searchTerm.toLowerCase();
    const u = (a.usuario || '').toLowerCase();
    return (
      u.includes(q) ||
      a.nombres.toLowerCase().includes(q) ||
      a.apellidos.toLowerCase().includes(q) ||
      a.telefono.includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Header Bar */}
      <div className="responsive-topbar">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Crown size={20} color="#f59e0b" />
            Gestión de Administradores Municipales (Exclusivo Superadmin)
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Jefes de turno y supervisores con rol 'administrador' (Contraseñas encriptadas con bcrypt)
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#f59e0b',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <UserPlus size={16} />
            Nuevo Administrador
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div style={{
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        flex: 1,
        overflow: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Usuario</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Nombres y Apellidos</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Teléfono</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Rol</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600 }}>Seguridad</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No se encontraron administradores registrados.
                </td>
              </tr>
            ) : (
              filtered.map((adm) => (
                <tr key={adm.usuario} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f59e0b' }}>
                    @{adm.usuario}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'white' }}>
                    {adm.nombres} {adm.apellidos}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={14} color="#60a5fa" />
                      {adm.telefono}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}>
                      ADMINISTRADOR
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: 'rgba(34, 197, 94, 0.15)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <Lock size={11} /> Cifrado bcrypt
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(adm)}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: 'none',
                          color: '#f59e0b',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        title="Editar Administrador"
                      >
                        <Edit3 size={15} />
                      </button>
                      {adm.usuario !== 'admin' && (
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar al administrador @${adm.usuario}?`)) {
                              onDeleteAdministrator(adm.usuario);
                            }
                          }}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: 'none',
                            color: '#ef4444',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                          title="Eliminar Administrador"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear / Editar Administrador */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid #f59e0b',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={18} />
                {editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador Municipal'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Usuario (Login)*
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingAdmin}
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="ej. supervisor_pisco"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: editingAdmin ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Nombres*
                  </label>
                  <input
                    type="text"
                    required
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="Carlos"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Apellidos*
                  </label>
                  <input
                    type="text"
                    required
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="Mendoza"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.2)',
                      color: 'white',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Teléfono de Contacto*
                </label>
                <input
                  type="text"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="987654321"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  <Key size={13} color="#f59e0b" />
                  {editingAdmin ? 'Cambiar Contraseña (opcional)' : 'Contraseña de Acceso (se encriptará con bcrypt)*'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingAdmin ? 'Dejar vacío para no cambiar' : 'Admin@Segura2026!'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'white',
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
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f59e0b',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Save size={15} />
                  {saving ? 'Guardando...' : 'Guardar Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
