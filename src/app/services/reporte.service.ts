import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private apiUrl = 'http://localhost:3000/api/reportes';
  constructor(private http: HttpClient) {}

  uploadReporte(filename: string, dataBase64: string, tipo_reporte?: string, id_usuario_generador?: number, parametros?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload`, { filename, dataBase64, tipo_reporte, id_usuario_generador, parametros });
  }

  listarReportes(limit: number = 20): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?limit=${limit}`);
  }

  listarUltimos(limit: number = 20, tipo?: string, subtipo?: string): Observable<any[]> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (tipo) params.set('tipo', tipo);
    if (subtipo) params.set('subtipo', subtipo);
    const qs = params.toString();
    return this.http.get<any[]>(`${this.apiUrl}/ultimos${qs ? '?' + qs : ''}`);
  }
}
