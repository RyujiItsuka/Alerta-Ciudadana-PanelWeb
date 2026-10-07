export type UserRole = 'superadmin' | 'administrador' | 'tecnico' | 'ciudadano';

export interface UserSession {
  id: string;
  nombre: string;
  email?: string;
  rol: 'superadmin' | 'administrador' | 'tecnico';
  cargo: string;
  usuario: string;
}

export interface AlertaReporte {
  id_reporte: number;
  descripcion: string;
  fecha_hora: string;
  id_estado: number;
  estado_nombre?: string;
  tipo_incidencia?: {
    nombre: string;
  };
  ubicacion?: {
    latitud: number;
    longitud: number;
    direccion_texto?: string;
  };
  ciudadano?: {
    nombres: string;
    apellidos: string;
    telefono: string;
    dni: string;
  };
  origen_alerta?: string;
}

export interface CiudadanoItem {
  id_persona: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  rol: string;
  created_at?: string;
  estado_cuenta?: 'activo' | 'suspendido';
}

export interface TecnicoItem {
  id_operador?: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  turno?: string;
  rol: string;
  estado?: string;
  created_at?: string;
  password?: string;
}

export interface SystemConfig {
  phoneCentral: string;
  sensorShakeThreshold: number;
  gpsTrackingIntervalSeconds: number;
  modoMantenimiento: boolean;
  greenApiActive: boolean;
}
