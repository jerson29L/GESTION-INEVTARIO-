import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap, of, throwError } from 'rxjs';

export interface Usuario {
  id: number;           // id_usuario
  nombre_completo: string;
  email: string;
  password?: string;    // solo para crear/actualizar
  id_rol: number;
  rol_nombre?: string;
  estado: number;       // 1 = activo, 0 = inactivo
  fecha_creacion?: string;
}

export interface Role {
  id: number;          // id_rol
  nombre: string;      // nombre_rol
  descripcion?: string;
  permisos?: any;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  // Usar el nombre solicitado 'modulo_user' para evitar colisiones con otros módulos
  private apiUrl = 'http://localhost:3000/api/modulo_user';
  private usuarios$ = new BehaviorSubject<Usuario[]>([]);
  private roles$ = new BehaviorSubject<Role[]>([]);

  constructor(private http: HttpClient) {
    // Do not auto-load on service construction to avoid SSR requests without auth token.
    // Call init() from a client-side component after login or on component init.
  }

  /**
   * Initialize the service by loading roles and usuarios.
   * Only run on the browser (avoid SSR unauthenticated requests).
   */
  init() {
    if (typeof window === 'undefined') return;
    this.cargarRoles();
    this.cargarUsuarios();
  }

  private cargarRoles() {
    this.http.get<Role[]>(`${this.apiUrl}/roles`).pipe(
      catchError(error => {
        console.error('Error al cargar roles:', error);
        return of([] as Role[]);
      })
    ).subscribe(roles => this.roles$.next(roles));
  }

  private cargarUsuarios() {
    this.http.get<Usuario[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error al cargar usuarios:', error);
        return of([] as Usuario[]);
      })
    ).subscribe(usuarios => this.usuarios$.next(usuarios));
  }

  getRoles(): Observable<Role[]> {
    return this.roles$.asObservable();
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.usuarios$.asObservable();
  }

  addUsuario(payload: Partial<Usuario>): Observable<any> {
    return this.http.post(this.apiUrl, payload).pipe(
      tap(() => this.cargarUsuarios()),
      catchError(error => {
        console.error('Error al crear usuario:', error);
        return throwError(() => error);
      })
    );
  }

  updateUsuario(id: number, changes: Partial<Usuario>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, changes).pipe(
      tap(() => this.cargarUsuarios()),
      catchError(error => {
        console.error('Error al actualizar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.cargarUsuarios()),
      catchError(error => {
        console.error('Error al eliminar usuario:', error);
        return throwError(() => error);
      })
    );
  }
}
