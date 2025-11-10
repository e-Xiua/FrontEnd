import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {

  private baseUrl = 'http://localhost:8080/api/reserva';
  //private baseUrl = 'http://localhost:8765/api/reservas';

  constructor(private http: HttpClient) { }

  // Obtener headers con token
  private obtenerHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  // Obtener todas las reservas
  getAll(): Observable<any> {
    return this.http.get(`${this.baseUrl}/all`, { headers: this.obtenerHeaders() });
  }

  // Buscar reserva por ID
  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/search/${id}`, { headers: this.obtenerHeaders() });
  }

  // Guardar nueva reserva
  save(reserva: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/save`, reserva, { headers: this.obtenerHeaders() });
  }

  // Actualizar una reserva existente
  update(reserva: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update`, reserva, { headers: this.obtenerHeaders() });
  }

  // Eliminar una reserva por ID
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete/${id}`, { headers: this.obtenerHeaders() });
  }

  // Obtener reservas por ID del turista
  getReservasPorTurista(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/reservasTurista/${id}`, { headers: this.obtenerHeaders() });
  }
}
