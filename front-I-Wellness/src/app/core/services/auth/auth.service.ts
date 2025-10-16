import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:8082/auth'; // URL completa al backend
  //private apiUrl = 'http://localhost:8765/api/auth';

  constructor(private http: HttpClient) { }

  // Método para el login
  login(correo: string, contraseña: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const body = {
      correo: correo,
      contraseña: contraseña
    };

    return this.http.post(`${this.apiUrl}/login`, body, {
      headers,
      responseType: 'text' // JWT en texto plano
    }).pipe(
      tap((token: string) => {
        if (token) {
          localStorage.setItem('token', token);
        }
      }),
      switchMap((token: string) => {
        // Una vez que tenemos el token, obtenemos el rol del usuario
        return this.getUsuarioActual().pipe(
          map((rol: string) => {
            // Guardamos el rol
            localStorage.setItem('rol', rol);

            // Devolvemos un objeto con el token y el rol
            return { token, rol };
          })
        );
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => new Error(error.error || 'Error en el inicio de sesión'));
      })
    );
  }



  getUsuarioActual(): Observable<string> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/role`, {
      headers,
      responseType: 'text' // evitar el error de JSON.parse
    }).pipe(
      catchError(error => {
        console.error('Error al obtener usuario actual:', error);
        return throwError(() => new Error(error.error || 'Error al obtener usuario'));
      })
    );
  }

  usuarioHome(): Observable<string> {
    const token = this.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get(`${this.apiUrl}/info`, {
      headers,
      responseType: 'text' // evitar el error de JSON.parse
    }).pipe(
      catchError(error => {
        console.error('Error al obtener usuario actual:', error);
        return throwError(() => new Error(error.error || 'Error al obtener usuario'));
      })
    );
  }


  registerProveedor(proveedorData: any): Observable<any> {
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
      telefonoEmpresa: proveedorData.telefonoEmpresa,
      foto: proveedorData.foto
    };

    return this.http.post<any>(`${this.apiUrl}/registro/Proveedor`, body, {
      headers,
      responseType: 'text' as 'json'
    }).pipe(
      switchMap((response) => {
        console.log('Respuesta de registro:', response);

        // Después del registro exitoso, hacer login automático
        return this.login(proveedorData.correo, proveedorData.contraseña).pipe(
          map(loginResponse => ({
            success: true,
            message: response,
            loginData: loginResponse
          }))
        );
      }),
      catchError(error => {
        console.error('Error en registro de Proveedor:', error);
        return throwError(() => new Error(error.error || 'Error en el registro de Proveedor'));
      })
    );
  }

  // Similar para registerTurista
  registerTurista(turistaData: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const body = {
      nombre: turistaData.nombre,
      correo: turistaData.correo,
      contraseña: turistaData.contraseña,
      telefono: turistaData.telefono,
      ciudad: turistaData.ciudad,
      pais: turistaData.pais,
      genero: turistaData.genero,
      fechaNacimiento: turistaData.fechaNacimiento,
      estadoCivil: turistaData.estadoCivil,
      foto: turistaData.foto
    };

    console.log("turista: ",body)

    return this.http.post<any>(`${this.apiUrl}/registro/Turista`, body, {
      headers,
      responseType: 'text' as 'json'
    }).pipe(
      switchMap((response) => {
        console.log('Respuesta de registro:', response);

        // Después del registro exitoso, hacer login automático
        return this.login(turistaData.correo, turistaData.contraseña).pipe(
          map(loginResponse => ({
            success: true,
            message: response,
            loginData: loginResponse
          }))
        );
      }),
      catchError(error => {
        console.error('Error en registro de turista:', error);
        return throwError(() => new Error(error.error || 'Error en el registro de turista'));
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

  getUserInfo(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No hay token disponible'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${this.apiUrl}/info`, { headers }).pipe(
      map(response => {
        // Si la respuesta es una cadena JSON, la parseamos
        if (typeof response === 'string') {
          return JSON.parse(response);
        }
        return response;
      }),
      catchError(error => {
        console.error('Error al obtener información del usuario:', error);
        return throwError(() => new Error(error.error || 'Error al obtener usuario'));
      })
    );
  }

  getCurrentUserId(): Observable<number> {
    return this.getUserInfo().pipe(
      map(userInfo => userInfo.id)
    );
  }

  getCurrentUserRole(): string | null {
    return localStorage.getItem('rol');
  }
}
