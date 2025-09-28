export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: Date;
  duracion: number;
  costo: number;
  asistentes: string[];
  tipo: 'evento' | 'reunion';
  color: string;
}

export interface EventoForm {
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  duracion: number;
  costo?: number;
  asistentes: string;
}
