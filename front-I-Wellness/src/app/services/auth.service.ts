import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8082/auth'; // URL completa al backend
  
  constructor(private http: HttpClient) { }

  // Método para el login
 
  login(correo: string, contraseña: string): Observable<string> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
    const body = {
      correo: correo,
      contraseña: contraseña
    };
  
    return this.http.post(`${this.apiUrl}/login`, body, { 
      headers, 
      responseType: 'text' // <-- Aquí forzamos la respuesta como texto
    }).pipe(
      tap((token: string) => {
        if (token) {
          localStorage.setItem('token', token); // Guardamos el JWT
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => new Error(error.error || 'Error en el inicio de sesión'));
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

    // Modificación para manejar mejor la respuesta
  return this.http.post<any>(`http://localhost:8082/auth/registro/Turista`, body, { 
    headers,
    responseType: 'text' as 'json'  // Cambiado para manejar respuesta de texto
  }).pipe(
    map(response => {
      // Si la respuesta es un string, devuélvelo directamente
      return { message: response };
    }),
    catchError(error => {
      console.error('Error en registro de turista:', error);
      // Si hay un error, intentamos extraer el mensaje
      return throwError(() => new Error(error.error || 'Error en el registro de turista'));
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

    return this.http.post<any>(`http://localhost:8082/auth/registro/Proveedor`, body, { 
      headers,
      responseType: 'text' as 'json'  // Cambiado para manejar respuesta de texto
    }).pipe(
      map(response => {
        // Si la respuesta es un string, devuélvelo directamente
        return { message: response };
      }),
      catchError(error => {
        console.error('Error en registro de Proveedor:', error);
        // Si hay un error, intentamos extraer el mensaje
        return throwError(() => new Error(error.error || 'Error en el registro de Proveedor'));
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