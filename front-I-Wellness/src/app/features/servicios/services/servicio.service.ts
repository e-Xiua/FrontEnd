import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {

  private baseUrl = 'http://localhost:8080/api/servicio';  // Ajusta la URL si usas otro puerto o contexto
  //private baseUrl = 'http://localhost:8765/api/providers';

  constructor(private http: HttpClient) {}

    // Método para obtener las cabeceras con el token
    private obtenerHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      return new HttpHeaders({
        'Authorization': token ? `Bearer ${token}` : ''
      });
    }

  obtenerTodos(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/all`).pipe(
      catchError(this.handleError)
    );
  }

  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/search/${id}`).pipe(
      catchError(this.handleError)
    );
  }
  guardar(servicio: any): Observable<any> {
    const headers = this.obtenerHeaders();
    return this.http.post<any>(`${this.baseUrl}/save`, servicio, { headers }).pipe(
      catchError(this.handleError),
    );
  }


  actualizar(id: number, servicio: any): Observable<any> {
  const headers = this.obtenerHeaders();
  return this.http.put<any>(`${this.baseUrl}/update/${id}`, servicio, { headers }).pipe(
    catchError(this.handleError)
  );
}

  eliminar(id: number): Observable<string> {
    const headers = this.obtenerHeaders();
    return this.http.delete(`${this.baseUrl}/delete/${id}`, {
      headers,
      responseType: 'text' as const
    }).pipe(
      catchError(this.handleError)
    );
  }


  obtenerServiciosPorProveedor(idProveedor: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${idProveedor}/servicios`).pipe(
      catchError(this.handleError)
    );
  }

  eliminarServiciosPorProveedor(idProveedor: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/eliminarPorProveedor/${idProveedor}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
