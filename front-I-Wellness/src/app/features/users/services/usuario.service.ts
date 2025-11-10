import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:8082/usuarios';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor(private http: HttpClient) { }

  // Función para obtener el token y configurar los headers
  private obtenerHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  obtenerTodos(): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${API_URL}/all`, { headers });
  }

  obtenerPorId(id: number): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${API_URL}/buscar/${id}`, { headers });
  }

  obtenerPorIdPublico(id: number): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${API_URL}/perfil-publico/${id}`, { headers });
  }

    /**
   * Añade un usuario a la lista de contactos del usuario actual.
   * @param ownerId El ID del usuario que está añadiendo el contacto.
   * @param contactId El ID del usuario que será añadido.
   */
  addContact(ownerId: number, contactId: number): Observable<void> {
    const headers = this.obtenerHeaders();
    // Llama al endpoint POST /api/users/{ownerId}/contacts/{contactId}
    return this.http.post<void>(`${API_URL}/${ownerId}/contacts/${contactId}`, {}, { headers });
  }

    /**
   * Obtiene la lista de contactos de un usuario específico.
   * @param userId El ID del usuario del cual se quieren obtener los contactos.
   */
  getContacts(userId: number): Observable<any[]> {
    const headers = this.obtenerHeaders();
    return this.http.get<any[]>(`${API_URL}/${userId}/contacts`, { headers });
  }

  // NUEVO MÉTODO PARA OBTENER EL PERFIL DEL USUARIO ACTUAL
  obtenerPerfilActual(): Observable<any> {
    const headers = this.obtenerHeaders();
    return this.http.get(`${API_URL}/perfil`, { headers });
  }

  editarTurista(id: number, datos: any): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    console.log('en el servicio front Datos a editar:', datos);
    console.log('ID del usuario a editar:', id);
    return this.http.put(`${API_URL}/editarTurista/${id}`, datos, { headers });
  }

  editarProveedor(id: number, datos: any): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.put(`${API_URL}/editarProveedor/${id}`, datos, { headers });
  }

  eliminarUsuario(id: number): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.delete(`${API_URL}/eliminar/${id}`, { headers });
  }

  obtenerProveedores(): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${API_URL}/proveedores`, { headers });
  }

  obtenerTuristas(): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${API_URL}/turistas`, { headers });
  }

  obtenerPorCorreo(correo: string): Observable<any> {
    const headers = this.obtenerHeaders(); // Agregar token en los headers
    return this.http.get(`${API_URL}/obtenerPorCorreo/${correo}`, { headers });
  }
}
