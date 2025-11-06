import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Marca {
  id_marca: number;
  nombre_marca: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
  activo: boolean;
  fecha_registro: string;
}

@Injectable({
  providedIn: 'root'
})
export class MarcaService {
  private apiUrl = 'http://localhost:3000/api/marcas';

  constructor(private http: HttpClient) {}

  obtenerMarcas(): Observable<Marca[]> {
    return this.http.get<Marca[]>(this.apiUrl);
  }

  crearMarca(marca: Partial<Marca>): Observable<any> {
    return this.http.post(this.apiUrl, marca);
  }

  actualizarMarca(id: number, marca: Partial<Marca>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, marca);
  }

  eliminarMarca(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}