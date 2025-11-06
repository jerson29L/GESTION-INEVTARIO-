import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DetalleMovimiento {
  id_producto: number;
  cantidad: number;
  producto_nombre?: string;
  producto_codigo?: string;
  stock_actual?: number;
  lote_afectado?: string;
}

export interface MovimientoInventario {
  id_tipo_movimiento: number;
  fecha_movimiento: string;
  id_usuario_responsable: number;
  motivo: string;
  observaciones?: string;
  detalles: DetalleMovimiento[];
}

@Injectable({
  providedIn: 'root'
})
export class SalidaService {
  private apiUrl = 'http://localhost:3000/api/movimientos';

  constructor(private http: HttpClient) {}

  // Registrar una nueva salida de inventario
  registrarSalida(movimiento: MovimientoInventario): Observable<any> {
    return this.http.post(this.apiUrl, movimiento);
  }

  // Obtener historial de salidas (lista plana desde el backend)
  obtenerSalidas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?tipo=Decrementa`);
  }

  // Obtener todos los movimientos (sin filtro)
  obtenerMovimientos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  // Obtener tipos de movimiento
  obtenerTiposMovimiento(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tipos`);
  }

  // Top productos por salidas
  obtenerTopSalidas(limit: number = 10, from?: string, to?: string): Observable<any[]> {
    const params: string[] = [];
    if (limit) params.push(`limit=${limit}`);
    if (from && to) params.push(`from=${from}&to=${to}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.http.get<any[]>(`${this.apiUrl}/top-salidas${q}`);
  }
}
