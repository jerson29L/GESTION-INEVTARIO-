import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AppComponent } from '../app';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    nombre_completo: string;
    email: string;
    rol_nombre: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private userSubject = new BehaviorSubject<any>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  // Demo mode: auto-inicia sesión para acceso directo sin credenciales
  private readonly DEMO_MODE = false; // desactivado para usar login contra la BD

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Recuperar sesión del localStorage solo en el navegador (evitar SSR error)
    if (typeof window !== 'undefined' && window?.localStorage) {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        if (savedUser && savedToken) {
          try {
            this.userSubject.next(JSON.parse(savedUser));
          } catch (e) {
            console.warn('AuthService: fallo parseando user desde localStorage', e);
            this.userSubject.next(null);
          }
          this.tokenSubject.next(savedToken);
          try {
            AppComponent.isLoggedIn = true;
          } catch (e) {
            // ignore
          }
        }
      } catch (e) {
        console.warn('AuthService: no se pudo acceder a localStorage', e);
      }
    }

    // Demo: si está activado y no hay sesión cargada, crear una sesión de demostración
    if (this.DEMO_MODE && !this.tokenSubject.value) {
      const demoUser = {
        id: 999,
        nombre_completo: 'Usuario Demo',
        email: 'demo@yerb.com',
        rol_nombre: 'Administrador'
      };
      try {
        if (typeof window !== 'undefined' && window?.localStorage) {
          localStorage.setItem('token', 'demo-token');
          localStorage.setItem('user', JSON.stringify(demoUser));
        }
      } catch {}
      this.userSubject.next(demoUser);
      this.tokenSubject.next('demo-token');
      try { AppComponent.isLoggedIn = true; } catch {}
      // Si ya estamos en la ruta '', el guard de redirect nos enviará al dashboard
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        // Guardar sesión solo si estamos en el navegador
        if (typeof window !== 'undefined' && window?.localStorage) {
          try {
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
          } catch (e) {
            console.warn('AuthService: no se pudo guardar sesión en localStorage', e);
          }
        }
        this.userSubject.next(response.user);
        this.tokenSubject.next(response.token);
        // marcar estado global para el guard de rutas
        try {
          AppComponent.isLoggedIn = true;
        } catch (e) {
          // ignore if AppComponent not available in certain envs
        }
      })
    );
  }

  logout(): void {
    if (typeof window !== 'undefined' && window?.localStorage) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {
        console.warn('AuthService: no se pudo limpiar localStorage en logout', e);
      }
    }
    this.userSubject.next(null);
    this.tokenSubject.next(null);
    try {
      AppComponent.isLoggedIn = false;
    } catch (e) {
      // ignore
    }
    // la ruta de login está en '' (root)
    this.router.navigate(['']);
  }

  isLoggedIn(): boolean {
    return this.tokenSubject.value !== null;
  }

  getCurrentUser() {
    return this.userSubject.value;
  }

  getToken() {
    return this.tokenSubject.value;
  }
}