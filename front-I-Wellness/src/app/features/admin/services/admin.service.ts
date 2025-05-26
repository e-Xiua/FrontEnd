import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = 'http://localhost:8082/admin'; 

  constructor(private http: HttpClient) { }

  // Método para obtener las cabeceras con el token
  private obtenerHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Obtener todos los usuarios
  obtenerTodosLosUsuarios(): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${this.apiUrl}/usuarios`, { headers });
  }

  // Obtener todos los turistas
  obtenerTuristas(): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${this.apiUrl}/turistas`, { headers });
  }

  // Obtener todos los proveedores
  obtenerProveedores(): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${this.apiUrl}/proveedores`, { headers });
  }

  // Obtener usuario por ID
  obtenerUsuarioPorId(id: number): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${this.apiUrl}/usuarios/${id}`, { headers });
  }

  // Crear un nuevo turista
  crearTurista(turistaDTO: any): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.post(`${this.apiUrl}/turistas`, turistaDTO, { headers });
  }

  // Crear un nuevo proveedor
  crearProveedor(proveedorDTO: any): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.post(`${this.apiUrl}/proveedores`, proveedorDTO, { headers });
  }

    // Actualizar un admin
    actualizarAdmin(id: number, adminDTO: any): Observable<any> {
      const headers = this.obtenerHeaders(); // Agregar token en los headers
      return this.http.put(`${this.apiUrl}/admin/${id}`, adminDTO, { headers });
    }

  // Actualizar un turista
  actualizarTurista(id: number, turistaDTO: any): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.put(`${this.apiUrl}/turistas/${id}`, turistaDTO, { headers });
  }

  // Actualizar un proveedor
  actualizarProveedor(id: number, proveedorData: any): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.put(`${this.apiUrl}/proveedores/${id}`, proveedorData, { headers });
  }

  // Eliminar un usuario
  eliminarUsuario(id: number): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, { headers, responseType: 'text' });
  }

  // Obtener estadísticas para el dashboard
  obtenerEstadisticas(): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${this.apiUrl}/dashboard`, { headers });
  }
}
