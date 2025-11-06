import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';

export interface Producto {
  id: number;           // id_producto
  sku: string;         // codigo_producto
  name: string;        // nombre_producto
  descripcion: string;
  price: number;       // precio_unitario
  provider: string;    // nombre_marca
  stock: number;       // stock_actual
  stockminimo: number; // stock_minimo
  date: string;        // fecha_creacion
  idcategoria: number;
  estado: number;      // 1 = activo, 0 = inactivo
  estado_stock: string; // 'Activo', 'Inactivo', 'Bajo Stock', 'Stock Crítico'
  categoria_nombre: string;
  lote: string;
  id_display?: string;
  categoryName?: string;
}

export interface Categoria {
  idcategoria: number;
  nombre: string;
}

@Injectable({ 
  providedIn: 'root' 
})
export class ProductoService {
  private apiUrl = 'http://localhost:3000/api/productos';

  constructor(private http: HttpClient) {}

  // 🔍 Obtener todos los productos
  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error al obtener productos:', error);
        throw error;
      })
    );
  }

  // 📝 Guardar nuevo producto
  guardarProducto(producto: any): Observable<any> {
    return this.http.post(this.apiUrl, producto).pipe(
      catchError(error => {
        console.error('Error al guardar producto:', error);
        throw error;
      })
    );
  }

  // 🗑️ Eliminar producto por ID
  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        console.error('Error al eliminar producto:', error);
        throw error;
      })
    );
  }

  // ✏️ Actualizar producto por ID
  actualizarProducto(id: number, producto: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, producto).pipe(
      catchError(error => {
        console.error('Error al actualizar producto:', error);
        throw error;
      })
    );
  }

  // 📂 Obtener categorías desde la base de datos
  obtenerCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`).pipe(
      catchError(error => {
        console.error('Error al obtener categorías:', error);
        throw error;
      })
    );
  }

  // 📦 Obtener proveedores únicos como texto
  obtenerProveedores(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/proveedores`).pipe(
      catchError(error => {
        console.error('Error al obtener proveedores:', error);
        throw error;
      })
    );
  }
}