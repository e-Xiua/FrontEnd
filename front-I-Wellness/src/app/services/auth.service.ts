import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/login'; // Ajusta esta URL a tu backend
  
  constructor(private http: HttpClient) { }

  // Método para el login
  login(correo: string, contraseña: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    const body = {
      correo: correo,
      contraseña: contraseña
    };

    return this.http.post<any>(`${this.apiUrl}/login`, body, { headers }).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.usuario));
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => new Error(error.error?.message || 'Error en el inicio de sesión'));
      })
    );
  }

  // Método para el registro de turistas
 registerTurista(turistaData: {
   nombre: string,
   correo: string,
   contraseña: string,
   telefono: string,
   ciudad: string,
   pais: string,
 }): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    const body = {
      nombre: turistaData.nombre,
      correo: turistaData.correo,
      contraseña: turistaData.contraseña,
      telefono: turistaData.telefono,
      ciudad: turistaData.ciudad,
      pais: turistaData.pais
    };

    return this.http.post<any>(`${this.apiUrl}/registro/turista`, body, { headers }).pipe(
      catchError(error => {
        console.error('Error en registro de turista:', error);
        return throwError(() => new Error(error.error?.message || 'Error en el registro de turista'));
      })
    );
  }

  // Método para el registro de proveedores
  registerProveedor(proveedorData: {
    nombre: string,
    correo: string,
    contraseña: string,
    nombre_empresa: string,
    coordenadaX: string,
    coordenadaY: string,
    cargoContacto: string,
    telefono: string,
    telefonoEmpresa: string
  }): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
    const body = {
      nombre: proveedorData.nombre,
      correo: proveedorData.correo,
      contraseña: proveedorData.contraseña,
      nombre_empresa: proveedorData.nombre_empresa,
      coordenadaX: proveedorData.coordenadaX,
      coordenadaY: proveedorData.coordenadaY,
      cargoContacto: proveedorData.cargoContacto,
      telefono: proveedorData.telefono,
      telefonoEmpresa: proveedorData.telefonoEmpresa
    };

    return this.http.post<any>(`${this.apiUrl}/registro/proveedor`, body, { headers }).pipe(
      catchError(error => {
        console.error('Error en registro de proveedor:', error);
        return throwError(() => new Error(error.error?.message || 'Error en el registro de proveedor'));
      })
    );
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  // Obtener el token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Obtener el usuario actual
  getCurrentUser(): any {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}