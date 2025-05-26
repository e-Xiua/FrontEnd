import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TuristaXPreferenciaService {
  private apiUrl = 'http://localhost:8081/api/turistaXPreferencia';

  constructor(private http: HttpClient) { }

  // Método para obtener las cabeceras con el token
  private obtenerHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Obtener todos los registros de turistaXPreferencia
  obtenerTodos(): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get<any>(`${this.apiUrl}/all`, { headers });
  }

  // Crear una nueva relación de Turista X Preferencia
  crear(turistaXPreferencia: any): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.post<any>(`${this.apiUrl}/crear`, turistaXPreferencia, { headers });
  }

  // Actualizar una relación de Turista X Preferencia
  actualizar(turistaXPreferencia: any): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.put<any>(`${this.apiUrl}/editar`, turistaXPreferencia, { headers });
  }

  // Eliminar una relación de Turista X Preferencia
  eliminar(id: number): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.delete<any>(`${this.apiUrl}/eliminar/${id}`, { headers });
  }

  // Obtener las relaciones por ID de turista
  obtenerPorTurista(idUsuario: number): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get<any>(`${this.apiUrl}/turista/${idUsuario}`, { headers });
  }

  // Obtener las relaciones por ID de preferencia
  obtenerPorPreferencia(idPreferencia: number): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get<any>(`${this.apiUrl}/preferencia/${idPreferencia}`, { headers });
  }

  // Eliminar todas las relaciones por ID de turista
  eliminarPreferenciasPorTurista(idTurista: number): Observable<string> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.delete(`${this.apiUrl}/eliminarPorTurista/${idTurista}`, { headers,
      responseType: 'text' as const // Asegúrate de que la respuesta sea texto plano
    });
  }
}
