import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { IncidenciaService, TipoIncidencia, IncidenciaRequest } from '../../services/incidencia.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-incidencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incidencias.html',
  styleUrl: './incidencias.css'
})
export class IncidenciasComponent implements OnInit {
  productos: any[] = [];
  tipos: TipoIncidencia[] = [];

  seleccionadoId: number | null = null;
  productoSeleccionado: any | null = null;
  cantidad = 1;
  fecha = new Date().toISOString().slice(0,10);
  tipoSeleccionadoId: number | null = null;
  descripcion = '';
  accion = '';
  guardando = false;
  mensajeExito = '';
  mensajeError = '';

  historial: any[] = [];

  constructor(
    private productoSvc: ProductoService,
    private incidenciaSvc: IncidenciaService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarTipos();
    this.cargarHistorial();
  }

  cargarProductos() {
    this.productoSvc.obtenerProductos().subscribe({
      next: (ps) => this.productos = ps,
      error: () => this.mensajeError = 'Error al cargar productos'
    });
  }

  cargarTipos() {
    this.incidenciaSvc.obtenerTipos().subscribe({
      next: (ts) => {
        this.tipos = ts;
        this.tipoSeleccionadoId = ts[0]?.id ?? null;
      },
      error: () => this.mensajeError = 'Error al cargar tipos de incidencia'
    });
  }

  cargarHistorial() {
    this.incidenciaSvc.obtenerHistorial().subscribe({
      next: (rows) => this.historial = rows,
      error: () => {}
    });
  }

  onSelectProducto(idStr: string) {
    const id = Number(idStr);
    this.seleccionadoId = Number.isFinite(id) ? id : null;
    this.productoSeleccionado = this.productos.find(p => (p.id ?? p.id_producto) === this.seleccionadoId) || null;
    this.cantidad = 1;
  }

  loteActual(): string {
    return this.productoSeleccionado?.lote || 'No especificado';
  }

  validarCantidad(): boolean {
    // La incidencia no afecta inventario: solo exigir cantidad > 0
    return this.cantidad > 0;
  }

  registrarIncidencia() {
    if (!this.productoSeleccionado || !this.tipoSeleccionadoId || !this.validarCantidad() || !this.descripcion.trim()) {
      this.mensajeError = 'Completa los campos requeridos correctamente';
      return;
    }

    const id_producto = this.productoSeleccionado.id ?? this.productoSeleccionado.id_producto;
    const currentUser = this.auth.getCurrentUser();
    if (!currentUser?.id) {
      this.mensajeError = 'Debes iniciar sesión para registrar una incidencia';
      return;
    }

    const payload: IncidenciaRequest = {
      id_producto,
      id_tipo_incidencia: this.tipoSeleccionadoId,
      cantidad_afectada: this.cantidad,
      fecha_incidencia: this.fecha,
      id_usuario_registro: currentUser.id,
      descripcion_detallada: this.descripcion,
      accion_tomada: this.accion || null
    };

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.incidenciaSvc.registrarIncidencia(payload).subscribe({
      next: () => {
        this.mensajeExito = 'Incidencia registrada';
        this.seleccionadoId = null;
        this.productoSeleccionado = null;
        this.cantidad = 1;
        this.descripcion = '';
        this.accion = '';
        this.cargarProductos();
        this.cargarHistorial();
        this.guardando = false;
      },
      error: (e) => {
        this.mensajeError = e?.error?.error || 'No se pudo registrar la incidencia';
        this.guardando = false;
      }
    });
  }

}
