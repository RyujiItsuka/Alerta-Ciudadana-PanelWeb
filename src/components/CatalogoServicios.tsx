import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Smartphone,
  MonitorSmartphone,
  MessageSquare,
  MapPin,
  Users,
  Activity,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  ShieldAlert,
  CircleQuestionMark,
  X,
  Layers,
} from 'lucide-react';
import {
  SERVICIOS,
  FAQS,
  ETIQUETA_AUDIENCIA,
  ETIQUETA_CRITICIDAD,
  COLOR_CRITICIDAD,
} from '../data/catalogoServicios';
import type { Servicio, Faq } from '../data/catalogoServicios';

/** Mapa de iconos: la clave es el nombre guardado en el catálogo de datos. */
const ICONOS: Record<string, React.ElementType> = {
  Smartphone,
  MonitorSmartphone,
  MessageSquare,
  MapPin,
  Users,
  Activity,
};

type Vista = 'servicios' | 'faq';

export const CatalogoServicios: React.FC = () => {
  const [vista, setVista] = useState<Vista>('servicios');
  const [busqueda, setBusqueda] = useState('');
  const [servicioAbierto, setServicioAbierto] = useState<string | null>(null);

  const termino = busqueda.trim().toLowerCase();

  // Filtrado de servicios por nombre, descripción, componentes o fallas.
  const serviciosFiltrados = useMemo(() => {
    if (!termino) return SERVICIOS;
    return SERVICIOS.filter((s) => {
      const enFallas = s.fallas.some(
        (f) =>
          f.sintoma.toLowerCase().includes(termino) ||
          f.causa.toLowerCase().includes(termino) ||
          f.solucion.toLowerCase().includes(termino)
      );
      return (
        s.nombre.toLowerCase().includes(termino) ||
        s.descripcion.toLowerCase().includes(termino) ||
        s.componentes.some((c) => c.toLowerCase().includes(termino)) ||
        enFallas
      );
    });
  }, [termino]);

  // Filtrado de FAQ por pregunta, respuesta o servicio asociado.
  const faqsFiltradas = useMemo(() => {
    if (!termino) return FAQS;
    return FAQS.filter((f) => {
      const servicio = SERVICIOS.find((s) => s.id === f.servicioId);
      return (
        f.pregunta.toLowerCase().includes(termino) ||
        f.respuesta.toLowerCase().includes(termino) ||
        (servicio?.nombre.toLowerCase().includes(termino) ?? false)
      );
    });
  }, [termino]);

  const totalFallas = useMemo(
    () => SERVICIOS.reduce((acc, s) => acc + s.fallas.length, 0),
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px' }}>
      {/* Cabecera */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(18, 24, 38, 0.7)',
          border: '1px solid var(--border-color)',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <BookOpen size={20} />
          Catálogo de Servicios y Base de Conocimiento
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Servicios que brinda la Central de Cámaras, con sus responsables, tiempos de atención y
          las soluciones a las fallas ya conocidas.
        </p>

        {/* Métricas rápidas */}
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '14px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { etiqueta: 'Servicios', valor: SERVICIOS.length, color: '#38bdf8' },
            { etiqueta: 'Soluciones documentadas', valor: totalFallas, color: '#34d399' },
            { etiqueta: 'Preguntas frecuentes', valor: FAQS.length, color: '#a78bfa' },
          ].map((m) => (
            <div key={m.etiqueta} style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{m.valor}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
                {m.etiqueta}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Barra de búsqueda y pestañas */}
      <div
        className="responsive-topbar"
        style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}
      >
        <div
          style={{
            flex: 1,
            minWidth: '220px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: '8px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Search size={16} color="#64748b" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar servicio, falla o pregunta..."
            aria-label="Buscar en el catálogo"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'white',
              fontSize: '13px',
              fontFamily: 'inherit',
            }}
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              aria-label="Limpiar búsqueda"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                padding: 0,
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {(
            [
              { id: 'servicios' as Vista, etiqueta: 'Servicios', icono: Layers },
              { id: 'faq' as Vista, etiqueta: 'Preguntas Frecuentes', icono: CircleQuestionMark },
            ]
          ).map((t) => {
            const Icono = t.icono;
            const activo = vista === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setVista(t.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${activo ? 'rgba(56,189,248,0.5)' : 'var(--border-color)'}`,
                  background: activo ? 'rgba(56,189,248,0.15)' : 'rgba(0,0,0,0.2)',
                  color: activo ? '#7dd3fc' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icono size={15} />
                {t.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido: Servicios */}
      {vista === 'servicios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {serviciosFiltrados.length === 0 && (
            <div
              className="glass-panel"
              style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}
            >
              No se encontraron servicios que coincidan con "{busqueda}".
            </div>
          )}

          {serviciosFiltrados.map((s) => (
            <FichaServicio
              key={s.id}
              servicio={s}
              abierto={servicioAbierto === s.id}
              onToggle={() => setServicioAbierto(servicioAbierto === s.id ? null : s.id)}
            />
          ))}
        </div>
      )}

      {/* Contenido: FAQ */}
      {vista === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqsFiltradas.length === 0 && (
            <div
              className="glass-panel"
              style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}
            >
              No se encontraron preguntas que coincidan con "{busqueda}".
            </div>
          )}

          {faqsFiltradas.map((f) => (
            <TarjetaFaq key={f.id} faq={f} />
          ))}
        </div>
      )}
    </div>
  );
};

/** Ficha desplegable de un servicio. */
const FichaServicio: React.FC<{
  servicio: Servicio;
  abierto: boolean;
  onToggle: () => void;
}> = ({ servicio, abierto, onToggle }) => {
  const Icono = ICONOS[servicio.icono] ?? BookOpen;
  const colorCrit = COLOR_CRITICIDAD[servicio.criticidad];

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      {/* Cabecera de la ficha (siempre visible) */}
      <button
        onClick={onToggle}
        aria-expanded={abierto}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '16px 18px',
          background: abierto ? 'rgba(56,189,248,0.06)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: 'inherit',
          fontFamily: 'inherit',
        }}
      >
        <div
          style={{
            padding: '10px',
            borderRadius: '10px',
            background: 'rgba(56,189,248,0.12)',
            color: '#38bdf8',
            display: 'flex',
            flexShrink: 0,
          }}
        >
          <Icono size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>{servicio.nombre}</h3>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '999px',
                background: `${colorCrit}22`,
                color: colorCrit,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              {ETIQUETA_CRITICIDAD[servicio.criticidad]}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
              }}
            >
              {ETIQUETA_AUDIENCIA[servicio.audiencia]}
            </span>
          </div>
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '4px',
              lineHeight: '1.5',
            }}
          >
            {servicio.descripcion}
          </p>
        </div>

        <div style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
          {abierto ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </button>

      {/* Detalle desplegable */}
      {abierto && (
        <div
          style={{
            padding: '0 18px 18px 18px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Datos de atención */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
              marginTop: '16px',
            }}
          >
            <DatoServicio icono={Clock} etiqueta="Horario de atención" valor={servicio.horario} />
            <DatoServicio icono={Target} etiqueta="Nivel de servicio" valor={servicio.sla} />
          </div>

          {/* Componentes */}
          <div>
            <TituloSeccion>Componentes técnicos</TituloSeccion>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
              {servicio.componentes.map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Fallas conocidas */}
          <div>
            <TituloSeccion>
              Soluciones a fallas conocidas ({servicio.fallas.length})
            </TituloSeccion>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              {servicio.fallas.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#fca5a5',
                      display: 'flex',
                      gap: '7px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <ShieldAlert size={15} style={{ marginTop: '1px', flexShrink: 0 }} />
                    <span>{f.sintoma}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.55' }}>
                    <strong style={{ color: 'var(--text-dim)' }}>Causa:</strong> {f.causa}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a7f3d0', marginTop: '6px', lineHeight: '1.55' }}>
                    <strong style={{ color: '#34d399' }}>Solución:</strong> {f.solucion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Tarjeta de una pregunta frecuente. */
const TarjetaFaq: React.FC<{ faq: Faq }> = ({ faq }) => {
  const servicio = SERVICIOS.find((s) => s.id === faq.servicioId);

  return (
    <div className="glass-panel" style={{ padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <CircleQuestionMark size={17} color="#a78bfa" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'white', lineHeight: '1.4' }}>
            {faq.pregunta}
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '7px', lineHeight: '1.6' }}>
            {faq.respuesta}
          </p>
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
            {servicio && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  background: 'rgba(56,189,248,0.12)',
                  color: '#7dd3fc',
                  fontWeight: 700,
                }}
              >
                {servicio.nombre}
              </span>
            )}
            <span
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
                fontWeight: 700,
              }}
            >
              Para: {ETIQUETA_AUDIENCIA[faq.audiencia]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/** Pequeño recuadro de dato (horario, SLA). */
const DatoServicio: React.FC<{
  icono: React.ElementType;
  etiqueta: string;
  valor: string;
}> = ({ icono: Icono, etiqueta, valor }) => (
  <div
    style={{
      padding: '10px 12px',
      borderRadius: '8px',
      background: 'rgba(0,0,0,0.25)',
      border: '1px solid var(--border-color)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '10px',
        color: 'var(--text-dim)',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
      }}
    >
      <Icono size={13} />
      {etiqueta}
    </div>
    <div style={{ fontSize: '12.5px', color: 'white', fontWeight: 600, marginTop: '4px' }}>{valor}</div>
  </div>
);

/** Encabezado de sección dentro de una ficha. */
const TituloSeccion: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: '11px',
      fontWeight: 800,
      color: 'var(--text-dim)',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}
  >
    {children}
  </div>
);
