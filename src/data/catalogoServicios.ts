/**
 * Catálogo de Servicios y Base de Conocimiento — Alerta Ciudadana Pisco
 *
 * Este archivo concentra el CONTENIDO del catálogo (fichas de servicio y
 * preguntas frecuentes), separado de la vista para que:
 *   1. Se pueda mantener sin tocar la interfaz.
 *   2. Se pueda exportar/cargar a Jira Service Management más adelante.
 *
 * Las fallas documentadas aquí NO son hipotéticas: provienen de incidencias
 * reales atendidas durante la operación del sistema (RLS abierto, contraseñas
 * en texto plano, número de despacho hardcodeado en el APK, entre otras).
 */

export type Criticidad = 'critica' | 'alta' | 'media';
export type Audiencia = 'ciudadano' | 'tecnico' | 'administrador' | 'sistema';

export interface FallaConocida {
  sintoma: string;
  causa: string;
  solucion: string;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  audiencia: Audiencia;
  criticidad: Criticidad;
  /** Horario de atención del servicio. */
  horario: string;
  /** Tiempo objetivo de primera respuesta ante una incidencia. */
  sla: string;
  /** Componentes técnicos que sostienen el servicio. */
  componentes: string[];
  /** Fallas reales ya atendidas, con su solución. */
  fallas: FallaConocida[];
}

export interface Faq {
  id: string;
  pregunta: string;
  respuesta: string;
  /** Servicio al que pertenece, para agrupar y filtrar. */
  servicioId: string;
  audiencia: Audiencia;
}

export const SERVICIOS: Servicio[] = [
  {
    id: 'app-panico',
    nombre: 'App de Pánico Ciudadano',
    descripcion:
      'Aplicación móvil Android que el vecino de Pisco usa para enviar una alerta geolocalizada a la Central de Cámaras ante una emergencia. El gesto de pánico se activa con pulsaciones rápidas del botón de encendido y el despacho continúa aunque la pantalla esté apagada.',
    icono: 'Smartphone',
    audiencia: 'ciudadano',
    criticidad: 'critica',
    horario: '24 × 7 × 365',
    sla: 'Crítico — primera respuesta 15 min',
    componentes: [
      'APK Android (Kotlin nativo)',
      'Servicio en primer plano de despacho y rastreo',
      'Acelerómetro y giroscopio para la detección del gesto',
      'GPS de alta precisión',
      'Supabase (reporte y ubicación)',
    ],
    fallas: [
      {
        sintoma: 'La app no instala o no abre el APK.',
        causa: 'Firma del paquete distinta a la instalada previamente, o versiones de Android no soportadas.',
        solucion:
          'Desinstalar la versión anterior antes de instalar la nueva. Verificar que el teléfono tenga Android 8.0 o superior y que permita instalar desde orígenes desconocidos.',
      },
      {
        sintoma: 'La app no obtiene ubicación o marca una posición equivocada.',
        causa: 'Permiso de ubicación restringido a "solo mientras se usa la app", o GPS desactivado.',
        solucion:
          'Ajustes → Aplicaciones → Alerta Pisco → Permisos → Ubicación → Permitir siempre. Activar la ubicación de alta precisión y salir a un lugar abierto para fijar el satélite.',
      },
      {
        sintoma: 'La alerta no llega al WhatsApp de la Central.',
        causa: 'Instancia de Green API sin sesión o sin saldo, o número destino mal configurado.',
        solucion:
          'Revisar el estado de la instancia de Green API en el panel (Auditoría & WhatsApp) y confirmar el número de despacho en Configuración Global. Escalar a nivel 2 si la instancia está caída.',
      },
      {
        sintoma: 'El gesto de pánico se dispara solo (falsos positivos).',
        causa: 'Umbral del detector mal calibrado respecto al movimiento cotidiano del vecino.',
        solucion:
          'Registrar tomas NO con movimientos habituales (guardar en el bolsillo, caminar, sacar de la mesa) usando el Calibrador de Gesto, y ajustar el umbral con los datos obtenidos.',
      },
      {
        sintoma: 'El gesto de pánico no se detecta cuando el ciudadano lo hace.',
        causa: 'Umbral demasiado alto, o el ciudadano no alcanza las 3 pulsaciones rápidas requeridas.',
        solucion:
          'Registrar tomas SÍ con el gesto real y bajar el umbral según los datos del Calibrador. Confirmar con el ciudadano que se necesitan 3 pulsaciones rápidas seguidas.',
      },
      {
        sintoma: 'La app consume mucha batería o se cierra sola.',
        causa: 'Servicio en primer plano activo tras finalizar el rastreo, o restricciones de ahorro energético del fabricante.',
        solucion:
          'Ajustes → Batería → excluir Alerta Pisco de la optimización. Verificar que el rastreo se detenga al resolver la alerta.',
      },
    ],
  },
  {
    id: 'panel-web',
    nombre: 'Panel Web de la Central',
    descripcion:
      'Aplicación web que usan los técnicos de cámaras y el administrador de la Central para recibir las alertas, despachar patrullas, seguir el rastreo en vivo y gestionar el personal. El acceso está protegido por usuario y contraseña con roles.',
    icono: 'MonitorSmartphone',
    audiencia: 'tecnico',
    criticidad: 'critica',
    horario: '24 × 7 × 365',
    sla: 'Crítico — primera respuesta 15 min',
    componentes: [
      'Frontend React (Vite)',
      'Edge Function `security` (autenticación y lecturas)',
      'Supabase Realtime (alertas en vivo)',
      'PostgreSQL con Row Level Security',
    ],
    fallas: [
      {
        sintoma: 'El técnico no puede entrar al panel (contraseña o bloqueo).',
        causa: 'Contraseña incorrecta, cuenta bloqueada por intentos fallidos, o PIN de recuperación mal ingresado.',
        solucion:
          'Usar "Restablecer contraseña" con el código OTP enviado por WhatsApp. Tras 5 intentos fallidos el código se invalida y hay que solicitar uno nuevo. El administrador puede restablecer el PIN desde Gestión de Técnicos.',
      },
      {
        sintoma: 'Un operador no ve las alertas o el rastreo.',
        causa: 'Sesión expirada, o políticas de acceso a datos mal configuradas en el servidor.',
        solucion:
          'Cerrar sesión y volver a entrar para renovar el token. Si persiste, es un problema de permisos en el servidor: escalar a nivel 2 (revisar políticas de acceso a `reporte` y `ubicacion`).',
      },
      {
        sintoma: 'El rastreo en vivo no se actualiza o muestra otra posición.',
        causa: 'Ventana de seguimiento (`?tracking=ID`) abierta sobre una alerta ya finalizada, o el dispositivo dejó de enviar ubicación.',
        solucion:
          'Verificar que la ventana corresponda al incidente activo y que el ciudadano tenga GPS y datos móviles. Reabrir el rastreo desde el incidente en curso.',
      },
      {
        sintoma: 'El panel no carga o muestra error de conexión.',
        causa: 'Edge Function caída o latencia alta hacia Supabase.',
        solucion:
          'Confirmar el estado en Estado del Sistema (superadmin). Si la base de datos no responde, escalar a nivel 2 de inmediato.',
      },
    ],
  },
  {
    id: 'despacho-whatsapp',
    nombre: 'Despacho por WhatsApp',
    descripcion:
      'Servicio que envía automáticamente la alerta ciudadana (texto e imagen con la ubicación) al WhatsApp de la Central de Cámaras mediante la pasarela Green API. El número destino se resuelve en el servidor y puede cambiarse sin recompilar la app.',
    icono: 'MessageSquare',
    audiencia: 'sistema',
    criticidad: 'critica',
    horario: '24 × 7 × 365',
    sla: 'Crítico — primera respuesta 15 min',
    componentes: [
      'Edge Function `whatsapp`',
      'Pasarela Green API',
      'Tabla `configuracion_sistema` (clave `whatsapp_central`)',
    ],
    fallas: [
      {
        sintoma: 'No llegan alertas al WhatsApp de la Central.',
        causa: 'Instancia de Green API sin sesión (QR desvinculado) o sin crédito.',
        solucion:
          'Verificar el estado de la instancia en Auditoría & WhatsApp. Re-vincular el QR o recargar saldo. Es la falla más frecuente y la de mayor impacto.',
      },
      {
        sintoma: 'Las alertas llegan a un número equivocado.',
        causa: 'Número de despacho mal configurado en `configuracion_sistema`.',
        solucion:
          'Corregir el número en Configuración Global (solo superadmin). No requiere tocar ni recompilar la app móvil: el servidor lo resuelve al despachar. Probar con un envío de prueba.',
      },
      {
        sintoma: 'El envío falla con error de pasarela (código 466 u otros).',
        causa: 'Número destino inválido o formato incorrecto (falta el código de país).',
        solucion:
          'Usar el formato internacional completo sin símbolos: `51` + número de 9 dígitos. Verificar en Configuración Global.',
      },
    ],
  },
  {
    id: 'rastreo-vivo',
    nombre: 'Rastreo GPS en Vivo',
    descripcion:
      'Seguimiento continuo de la ubicación del ciudadano durante una emergencia, visible en la Central mediante una ventana independiente que puede dejarse abierta en un monitor secundario.',
    icono: 'MapPin',
    audiencia: 'tecnico',
    criticidad: 'alta',
    horario: '24 × 7 × 365',
    sla: 'Alta — primera respuesta 30 min',
    componentes: [
      'Tabla `ubicacion`',
      'Supabase Realtime',
      'Ventana de seguimiento independiente (`?tracking=ID`)',
    ],
    fallas: [
      {
        sintoma: 'El mapa no muestra el punto del ciudadano.',
        causa: 'El dispositivo no envía ubicación (sin GPS, sin datos, o servicio detenido).',
        solucion:
          'Confirmar con el ciudadano que tenga GPS y datos activos. Verificar que el rastreo esté activo en el incidente.',
      },
      {
        sintoma: 'El mapa se queda congelado en una posición antigua.',
        causa: 'La ventana de seguimiento quedó asociada a una alerta ya cerrada.',
        solucion:
          'Cerrar la ventana y reabrir el rastreo desde el incidente activo.',
      },
    ],
  },
  {
    id: 'gestion-personal',
    nombre: 'Gestión de Personal',
    descripcion:
      'Altas, bajas y modificaciones de técnicos de cámara y administradores de Central, junto con el restablecimiento de PIN de ciudadanos. Las contraseñas se almacenan cifradas y nunca viajan al navegador.',
    icono: 'Users',
    audiencia: 'administrador',
    criticidad: 'media',
    horario: 'Horario administrativo (L–V 9:00–18:00)',
    sla: 'Media — primera respuesta 4 h hábiles',
    componentes: [
      'Edge Function `security` (staff-save / staff-delete)',
      'Tabla `operador_central`',
      'Bcrypt para el cifrado de contraseñas',
    ],
    fallas: [
      {
        sintoma: 'No se puede dar de alta a un técnico nuevo.',
        causa: 'Usuario ya existente, o contraseña no ingresada en el formulario.',
        solucion:
          'Verificar que el nombre de usuario no esté en uso y que la contraseña esté completa. Solo el administrador o el superadmin pueden crear personal.',
      },
      {
        sintoma: 'Un ciudadano olvidó su PIN.',
        causa: 'PIN de acceso olvidado.',
        solucion:
          'Usar "Restablecer PIN" en Gestión de Ciudadanos. Se envía un código al WhatsApp registrado del ciudadano.',
      },
      {
        sintoma: 'Un técnico aparece como inactivo sin explicación.',
        causa: 'Cambio de estado accidental o baja del personal.',
        solucion:
          'Revisar el estado en Gestión de Técnicos y reactivarlo si corresponde. Confirmar con el administrador antes de reactivar.',
      },
    ],
  },
  {
    id: 'calibrador-gesto',
    nombre: 'Calibrador de Gesto (Herramienta Interna)',
    descripcion:
      'Aplicación Android de uso interno que graba muestras etiquetadas del gesto de pánico (SÍ / NO) con el botón de encendido y los sensores de movimiento. Sirve para ajustar con datos reales el umbral del detector de la app ciudadana.',
    icono: 'Activity',
    audiencia: 'tecnico',
    criticidad: 'media',
    horario: 'Uso interno — sin atención al público',
    sla: 'Media — primera respuesta 4 h hábiles',
    componentes: [
      'APK Android (Kotlin nativo)',
      'Acelerómetro y giroscopio',
      'Almacenamiento local de muestras (CSV)',
    ],
    fallas: [
      {
        sintoma: 'La grabación no se detiene sola al elegir una duración.',
        causa: 'Con la pantalla apagada, el temporizador de la pantalla no corre.',
        solucion:
          'El temporizador debe vivir dentro del servicio de grabación, no en la pantalla. Verificar que la versión instalada incluya esta corrección.',
      },
      {
        sintoma: 'No se registran las pulsaciones del botón de encendido.',
        causa: 'Android no entrega el botón de encendido como evento de tecla; se detecta mediante encendido/apagado de pantalla.',
        solucion:
          'Es una limitación conocida de Android. Cada pulsación se registra como el par apagado + encendido de pantalla. Para máxima precisión, usar los botones de volumen como referencia.',
      },
    ],
  },
];

export const FAQS: Faq[] = [
  {
    id: 'faq-1',
    pregunta: '¿Qué hago si la app no obtiene la ubicación del ciudadano?',
    respuesta:
      'Pídele al ciudadano que revise en Ajustes → Aplicaciones → Alerta Pisco → Permisos → Ubicación, y que elija "Permitir siempre". Además debe tener activada la ubicación de alta precisión. Si está en interiores, que salga a un lugar abierto para que el GPS fije el satélite. Si el problema continua, abre un ticket de falla ciudadana con el modelo del teléfono y la versión de Android.',
    servicioId: 'app-panico',
    audiencia: 'ciudadano',
  },
  {
    id: 'faq-2',
    pregunta: 'La alerta no llegó al WhatsApp de la Central, ¿qué reviso?',
    respuesta:
      'Primero, verifica en el panel (Auditoría & WhatsApp) que la instancia de Green API esté en estado "authorized" y con saldo. Segundo, confirma en Configuración Global que el número de despacho sea el correcto. Si la instancia está caída, hay que re-vincular el QR: esa es la causa más frecuente y de mayor impacto, escala a nivel 2 de inmediato.',
    servicioId: 'despacho-whatsapp',
    audiencia: 'tecnico',
  },
  {
    id: 'faq-3',
    pregunta: '¿Cómo cambio el número de WhatsApp al que se envían las alertas?',
    respuesta:
      'Solo el superadmin puede hacerlo, desde Configuración Global en el panel web. Se escribe el número en formato internacional completo, sin símbolos (por ejemplo 51976264949). No hace falta actualizar ni recompilar la app móvil: el servidor resuelve el destino al momento de despachar. Después del cambio, haz un envío de prueba para confirmar.',
    servicioId: 'despacho-whatsapp',
    audiencia: 'administrador',
  },
  {
    id: 'faq-4',
    pregunta: 'Un técnico no puede entrar al panel, ¿cómo lo desbloqueo?',
    respuesta:
      'Indícale que use "Restablecer contraseña" y el código OTP que le llegará por WhatsApp. Ojo: tras 5 intentos fallidos el código se invalida y debe solicitar uno nuevo. Si perdió también el PIN, el administrador puede restablecerlo desde Gestión de Técnicos.',
    servicioId: 'panel-web',
    audiencia: 'administrador',
  },
  {
    id: 'faq-5',
    pregunta: 'El gesto de pánico se activa cuando el ciudadano no lo desea, ¿cómo lo corrijo?',
    respuesta:
      'Es un falso positivo por umbral mal calibrado. Se corrige grabando tomas etiquetadas como NO (movimiento cotidiano: guardar el teléfono en el bolsillo, caminar, sacarlo de la mesa) con el Calibrador de Gesto, y ajustando el umbral con esos datos. Nunca se ajusta "a ojo": siempre con las muestras reales.',
    servicioId: 'calibrador-gesto',
    audiencia: 'tecnico',
  },
  {
    id: 'faq-6',
    pregunta: '¿Qué hago si un ciudadano reporta que la app se cierra sola?',
    respuesta:
      'Pídele que excluya la app de la optimización de batería en Ajustes → Batería, ya que varios fabricantes suspenden la app en segundo plano y eso corta el despacho. Si el problema sigue, abre un ticket de falla ciudadana con el modelo del teléfono, la versión de Android y la versión de la app.',
    servicioId: 'app-panico',
    audiencia: 'ciudadano',
  },
  {
    id: 'faq-7',
    pregunta: '¿Quién puede dar de alta o de baja a un técnico?',
    respuesta:
      'Solo el administrador de Central y el superadmin, desde Gestión de Técnicos. La contraseña del nuevo técnico es obligatoria al momento del alta y se guarda cifrada; nunca viaja al navegador. El personal con rol técnico no puede gestionar a otros usuarios.',
    servicioId: 'gestion-personal',
    audiencia: 'administrador',
  },
  {
    id: 'faq-8',
    pregunta: 'El rastreo en vivo quedó congelado, ¿qué hago?',
    respuesta:
      'Cierra la ventana de seguimiento y vuelve a abrir el rastreo desde el incidente activo. Si el mapa sigue sin moverse, confirma con el ciudadano que tenga GPS y datos móviles activos, y que el rastreo esté marcado como activo en el incidente.',
    servicioId: 'rastreo-vivo',
    audiencia: 'tecnico',
  },
];

/** Etiquetas legibles para las audiencias. */
export const ETIQUETA_AUDIENCIA: Record<Audiencia, string> = {
  ciudadano: 'Ciudadano',
  tecnico: 'Técnico de Cámaras',
  administrador: 'Administrador de Central',
  sistema: 'Infraestructura',
};

/** Colores por criticidad, alineados con la paleta del panel. */
export const COLOR_CRITICIDAD: Record<Criticidad, string> = {
  critica: '#ef4444',
  alta: '#f59e0b',
  media: '#38bdf8',
};

/** Etiquetas legibles para la criticidad. */
export const ETIQUETA_CRITICIDAD: Record<Criticidad, string> = {
  critica: 'Crítica',
  alta: 'Alta',
  media: 'Media',
};
