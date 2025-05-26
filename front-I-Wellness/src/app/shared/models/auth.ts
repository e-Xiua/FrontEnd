export interface LoginRequest {
    correo: string;
    contraseña: string;
  }
  
  export interface LoginResponse {
    token: string;
    user: any;
  }
  
  export interface RegistroTuristaRequest {
    nombre: string;
    correo: string;
    contraseña: string;
    telefono: string;
    ciudad: string;
    pais: string;
    genero?: string;
    fechaNacimiento: Date | string;
    estadoCivil: string;
  }
  
  export interface RegistroProveedorRequest {
    nombre: string;
    correo: string;
    contraseña: string;
    nombre_empresa: string;
    coordenadaX: string;
    coordenadaY: string;
    cargoContacto?: string;
    telefono: string;
    telefonoEmpresa: string;
  }