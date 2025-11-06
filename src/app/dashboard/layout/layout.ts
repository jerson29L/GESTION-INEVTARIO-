import { Component, OnDestroy, OnInit, Inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; 
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterModule,
    LucideAngularModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Layout implements OnInit, OnDestroy {
  title = 'my-angular-app';
  userName = '';
  userRole = '';
  userInitials = '';
  nowText = '';
  private timer: any;

  constructor(private router: Router, private auth: AuthService, @Inject(PLATFORM_ID) private platformId: Object, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const u = this.auth.getCurrentUser?.();
    if (u) {
      this.userName = u.nombre_completo || '';
      this.userRole = u.rol_nombre || '';
      this.userInitials = this.computeInitials(this.userName);
    } else {
      this.userName = '';
      this.userRole = '';
      this.userInitials = '';
    }

    // Iniciar reloj solo en navegador
    if (isPlatformBrowser(this.platformId)) {
      const updateNow = () => {
        const now = new Date();
        // Formato en español: Martes, 04/11/2025 14:35:12
        const fecha = new Intl.DateTimeFormat('es-ES', {
          weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
        }).format(now);
        const hora = new Intl.DateTimeFormat('es-ES', {
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(now);
        // Capitalizar la primera letra del día
        this.nowText = `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)} ${hora}`;
        this.cdr.markForCheck();
      };
      updateNow();
      this.timer = setInterval(updateNow, 1000);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private computeInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
