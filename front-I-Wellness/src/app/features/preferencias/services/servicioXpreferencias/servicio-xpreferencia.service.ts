import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServicioXPreferenciaService {
  private apiUrl = 'http://localhost:8081/api/servicioXPreferencia'; 

  constructor(private http: HttpClient) { }

    // Método para obtener las cabeceras con el token
    private obtenerHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      return new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      });
    }

  // Obtener todos los servicios de preferencia
  obtenerTodos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all`);
  }

  // Crear una nueva relación de servicio x preferencia
  crear(servicioXPreferencia: any): Observable<any> {
    const headers = this.obtenerHeaders();
    return this.http.post<any>(`${this.apiUrl}/crear`, servicioXPreferencia, { headers });
  }

  // Actualizar una relación de servicio x preferencia
  actualizar(servicioXPreferencia: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/editar`, servicioXPreferencia);
  }

  // Eliminar una relación de servicio x preferencia
  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/eliminar/${id}`);
  }

  // Obtener por ID de servicio
  obtenerPorServicio(idServicio: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/servicio/${idServicio}`);
  }

  // Obtener por ID de preferencia
  obtenerPorPreferencia(idPreferencia: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/preferencia/${idPreferencia}`);
  }

// Eliminar todas las relaciones de preferencia por un servicio
eliminarPreferenciasPorServicio(idServicio: number): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/eliminarPorServicio/${idServicio}`, {
    responseType: 'text' as 'json'  
  });
}
}
