
import { Roles } from './roles';
export interface usuarios {
    id: number;
    nombre: string;
    correo: string;
    foto?: string;
    rol?: Roles;
    turistaInfo?: any;
    proveedorInfo?: any;
  }