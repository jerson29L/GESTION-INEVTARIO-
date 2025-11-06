import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoIncidencia {
  id: number;
  nombre_tipo: string;
  descripcion?: string;
}

export interface IncidenciaRequest {
  id_producto: number;
  id_tipo_incidencia: number;
  cantidad_afectada: number;
  fecha_incidencia: string; // yyyy-MM-dd
  id_usuario_registro: number;
  descripcion_detallada: string;
  accion_tomada?: string | null;
}

@Injectable({ providedIn: 'root' })
export class IncidenciaService {
  private apiUrl = 'http://localhost:3000/api/incidencias';

  constructor(private http: HttpClient) {}

  obtenerTipos(): Observable<TipoIncidencia[]> {
    return this.http.get<TipoIncidencia[]>(`${this.apiUrl}/tipos`);
    }

  registrarIncidencia(payload: IncidenciaRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, payload);
  }

  obtenerHistorial(limit = 50): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?limit=${limit}`);
  }
}
