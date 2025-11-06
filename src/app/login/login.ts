// Angular Core
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Third-party libraries
import { LucideAngularModule } from 'lucide-angular';

// Application services
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  showPassword = false;
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    this.errorMessage = '';
    this.loading = true;

    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor complete todos los campos';
      this.loading = false;
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        // Tras login, entrar directamente al dashboard dentro del módulo admin
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error) => {
        console.error('Error de login:', error);
        this.errorMessage = error.error?.error || 'Error al iniciar sesión';
        this.loading = false;
      }
    });
  }
}
