import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Evento } from '../../../shared/models/evento';

type EventoDtoTipo = 'EVENTO' | 'REUNION';

interface EventoDto {
  id?: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  duracion: number;
  costo: number;
  asistentes: string[];
  tipo: EventoDtoTipo;
  color?: string | null;
  activo?: boolean | null;
}

@Injectable({
  providedIn: 'root'
})
export class EventoApiService {
  private readonly baseUrl = 'http://localhost:8088/evento';

  constructor(private readonly http: HttpClient) {}

  getEventos(): Observable<Evento[]> {
    return this.http
      .get<EventoDto[]>(this.baseUrl)
      .pipe(map((eventos) => eventos.map((evento) => this.mapDtoToEvento(evento))));
  }

  getEvento(id: number | string): Observable<Evento> {
    return this.http
      .get<EventoDto>(`${this.baseUrl}/${id}`)
      .pipe(map((evento) => this.mapDtoToEvento(evento)));
  }

  createEvento(evento: Evento): Observable<Evento> {
    const dto = this.mapEventoToDto(evento);
    return this.http
      .post<EventoDto>(this.baseUrl, dto)
      .pipe(map((created) => this.mapDtoToEvento(created)));
  }

  updateEvento(evento: Evento): Observable<Evento> {
    const dto = this.mapEventoToDto(evento);
    return this.http
      .put<EventoDto>(this.baseUrl, dto)
      .pipe(map((updated) => this.mapDtoToEvento(updated)));
  }

  patchEvento(id: number | string, partial: Partial<Evento>): Observable<Evento> {
    const payload = this.mapPartialEventoToDto(partial);
    return this.http
      .patch<EventoDto>(`${this.baseUrl}/${id}`, payload)
      .pipe(map((updated) => this.mapDtoToEvento(updated)));
  }

  deleteEvento(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private mapDtoToEvento(dto: EventoDto): Evento {
    const tipo = dto.tipo === 'REUNION' ? 'reunion' : 'evento';
    return {
      id: dto.id !== undefined && dto.id !== null ? String(dto.id) : undefined,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      fecha: new Date(dto.fecha),
      duracion: Number(dto.duracion ?? 0),
      costo: Number(dto.costo ?? 0),
      asistentes: dto.asistentes ?? [],
      tipo,
      color: dto.color ?? this.getDefaultColor(tipo),
      activo: dto.activo ?? true
    };
  }

  private mapEventoToDto(evento: Evento): EventoDto {
    const tipo = evento.tipo === 'reunion' ? 'REUNION' : 'EVENTO';
    return {
      id: evento.id !== undefined ? Number(evento.id) : undefined,
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      fecha: evento.fecha.toISOString(),
      duracion: evento.duracion,
      costo: evento.costo,
      asistentes: evento.asistentes,
      tipo,
      color: evento.color,
      activo: evento.activo ?? true
    };
  }

  private mapPartialEventoToDto(partial: Partial<Evento>): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    if (partial.titulo !== undefined) {
      payload['titulo'] = partial.titulo;
    }
    if (partial.descripcion !== undefined) {
      payload['descripcion'] = partial.descripcion;
    }
    if (partial.fecha !== undefined) {
      payload['fecha'] = partial.fecha instanceof Date ? partial.fecha.toISOString() : partial.fecha;
    }
    if (partial.duracion !== undefined) {
      payload['duracion'] = partial.duracion;
    }
    if (partial.costo !== undefined) {
      payload['costo'] = partial.costo;
    }
    if (partial.asistentes !== undefined) {
      payload['asistentes'] = partial.asistentes;
    }
    if (partial.tipo !== undefined) {
      payload['tipo'] = partial.tipo === 'reunion' ? 'REUNION' : 'EVENTO';
    }
    if (partial.color !== undefined) {
      payload['color'] = partial.color;
    }
    if (partial.activo !== undefined) {
      payload['activo'] = partial.activo;
    }

    return payload;
  }

  private getDefaultColor(tipo: 'evento' | 'reunion'): string {
    return tipo === 'reunion' ? '#2196F3' : '#4CAF50';
  }
}

