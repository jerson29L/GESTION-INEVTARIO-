import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../../services/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true, // ✅ permite usar sin declararlo en un módulo
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css']
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  roles: { id: number; nombre: string; descripcion?: string; }[] = [];

  // Modal & form state
  showFormModal = false;
  showDeleteModal = false;
  editingUser: Partial<Usuario> = {};
  userToDelete: Usuario | null = null;

  // mensajes
  showSuccess = false;
  showError = false;
  errorMessage = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    // Initialize the usuario service (client only) then subscribe to its data streams
    this.usuarioService.init();

    this.usuarioService.getRoles().subscribe(roles => this.roles = roles);
    this.usuarioService.getUsuarios().subscribe(list => this.usuarios = list);
  }

  openNewUser(): void {
    this.editingUser = {
      nombre_completo: '',
      email: '',
      password: '',
      id_rol: this.roles[1]?.id || 2,
        estado: 1
    };
    this.showFormModal = true;
    this.clearMessages();
  }

  openEditUser(user: Usuario): void {
    this.editingUser = { ...user };
    this.showFormModal = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showFormModal = false;
    this.editingUser = {};
  }

  saveUser(): void {
    this.clearMessages();
    // Validaciones mínimas
    if (!this.editingUser.nombre_completo || !this.editingUser.email) {
      this.showError = true;
      this.errorMessage = 'Nombre y email son obligatorios.';
      return;
    }

    // Para usuario nuevo, validar password
    if (!this.editingUser.id && !this.editingUser.password) {
      this.showError = true;
      this.errorMessage = 'La contraseña es obligatoria para nuevos usuarios.';
      return;
    }

    // Crear o actualizar
    if (this.editingUser.id) {
        // Si no hay password en actualización, lo eliminamos del objeto
        const updateData = { ...this.editingUser };
        if (!updateData.password) {
            delete updateData.password;
        }
        
        this.usuarioService.updateUsuario(this.editingUser.id, updateData).subscribe({
          next: () => {
            this.showSuccess = true;
            this.closeForm();
            this.refreshUserList();
          },
          error: (error) => {
            this.showError = true;
            this.errorMessage = error.error?.error || 'Error al actualizar el usuario';
          }
        });
    } else {
        this.usuarioService.addUsuario(this.editingUser as Partial<Usuario>).subscribe({
          next: () => {
            this.showSuccess = true;
            this.closeForm();
            this.refreshUserList();
          },
          error: (error) => {
            this.showError = true;
            this.errorMessage = error.error?.error || 'Error al crear el usuario';
          }
        });
    }

  }

  askDelete(user: Usuario): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.userToDelete) return;
      this.usuarioService.deleteUsuario(this.userToDelete.id).subscribe({
        next: () => {
          this.showSuccess = true;
          this.showDeleteModal = false;
          this.userToDelete = null;
        },
        error: (error) => {
          this.showError = true;
          this.errorMessage = error.message || 'Error al eliminar el usuario';
          this.showDeleteModal = false;
          this.userToDelete = null;
        }
      });
  }

  closeDelete(): void {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  clearMessages(): void {
    this.showSuccess = false;
    this.showError = false;
    this.errorMessage = '';
  }

  refreshUserList(): void {
    this.usuarioService.getUsuarios().subscribe(list => {
      this.usuarios = list;
    });
  }
}
