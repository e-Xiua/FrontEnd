import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreferenciasService {

  private apiUrl = 'http://localhost:8081/api/preferencias';  

  constructor(private http: HttpClient) {}

  // Obtener todas las preferencias
  obtenerPreferencias(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all`);
  }

  // Obtener preferencia por ID
  obtenerPreferenciaPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/buscar/${id}`);
  }

  // Guardar una nueva preferencia
  guardarPreferencia(preferencia: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/guardar/`, preferencia);
  }

  // Actualizar una preferencia
  actualizarPreferencia(preferencia: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/editar/`, preferencia);
  }

  // Eliminar una preferencia
  eliminarPreferencia(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/eliminar/${id}`);
  }
}
