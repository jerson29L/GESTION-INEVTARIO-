import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { SalidaService, MovimientoInventario, DetalleMovimiento } from '../../services/salida.service';
import { AuthService } from '../../services/auth.service';

interface Producto {
  id: number;           // id_producto
  name: string;         // nombre_producto
  sku: string;         // codigo_producto
  stock: number;       // stock_actual
  // otros campos que no necesitamos para las salidas
  descripcion?: string;
  price?: number;
  provider?: string;
  stockminimo?: number;
  date?: string;
  idcategoria?: number;
  estado?: number;
  estado_stock?: string;
  categoria_nombre?: string;
  lote?: string;
}

interface TipoMovimiento {
  id: number;
  nombre_tipo: string;
  descripcion: string;
  afecta_stock: 'Incrementa' | 'Decrementa' | 'No Afecta';
}

@Component({
  selector: 'app-salidas',
  imports: [CommonModule, FormsModule],
  templateUrl: './salidas.html',
  styleUrl: './salidas.css',
  standalone: true
})
export class SalidasComponent implements OnInit {
  productos: Producto[] = [];
  tiposMovimiento: TipoMovimiento[] = [];
  productoSeleccionado: Producto | null = null;
  productoTemp: DetalleMovimiento = {
    id_producto: 0,
    cantidad: 1
  };
  movimiento: MovimientoInventario = {
    id_tipo_movimiento: 0,
    fecha_movimiento: new Date().toISOString().split('T')[0],
    id_usuario_responsable: 0,
    motivo: '',
    observaciones: '',
    detalles: []
  };
  mensajeExito: string = '';
  mensajeError: string = '';
  guardando: boolean = false;
  
  constructor(
    private productoService: ProductoService,
    private salidaService: SalidaService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarProductos();
    this.cargarTiposMovimiento();
    this.cargarHistorialSalidas();
  }

  cargarProductos() {
    this.productoService.obtenerProductos().subscribe({
      next: (productos) => {
        // Filtrar solo productos activos y con stock positivo
        this.productos = productos.filter(p => p.estado === 1 && p.stock > 0);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.mensajeError = 'Error al cargar los productos';
      }
    });
  }

  cargarTiposMovimiento() {
    this.salidaService.obtenerTiposMovimiento().subscribe({
      next: (tipos) => {
        this.tiposMovimiento = tipos.filter(t => t.afecta_stock === 'Decrementa');
        // Seleccionar por defecto el primer tipo disponible para habilitar el botón Registrar
        if (!this.movimiento.id_tipo_movimiento && this.tiposMovimiento.length > 0) {
          this.movimiento.id_tipo_movimiento = this.tiposMovimiento[0].id;
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de movimiento:', error);
        this.mensajeError = 'Error al cargar tipos de movimiento';
      }
    });
  }

  cargarHistorialSalidas() {
    this.salidaService.obtenerSalidas().subscribe({
      next: (salidas) => {
        this.historialSalidas = salidas;
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.mensajeError = 'Error al cargar el historial de salidas';
      }
    });
  }

  getTipoMovimiento(id: number): string {
    const tipo = this.tiposMovimiento.find(t => t.id === id);
    return tipo ? tipo.nombre_tipo : 'Desconocido';
  }

  calcularTotalSalida(salida: MovimientoInventario): number {
    return salida.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
  }

  productoSeleccionadoId: number = 0;
  historialSalidas: any[] = [];
  
  seleccionarProducto(id: number | string) {
    const parsedId = Number(id);
    if (!parsedId) {
      this.productoSeleccionado = null;
      return;
    }
    
    this.productoSeleccionado = this.productos.find(p => p.id === parsedId) || null;
    if (this.productoSeleccionado) {
      this.productoTemp.id_producto = this.productoSeleccionado.id;
      this.productoTemp.producto_nombre = this.productoSeleccionado.name;
      this.productoTemp.producto_codigo = this.productoSeleccionado.sku;
      this.productoTemp.stock_actual = this.productoSeleccionado.stock;
      this.productoTemp.lote_afectado = this.productoSeleccionado.lote || '';
    }
  }

  validarCantidad() {
    if (!this.productoSeleccionado) return false;
    return this.productoTemp.cantidad > 0 && this.productoTemp.cantidad <= this.productoSeleccionado.stock;
  }

  agregarProducto() {
    if (!this.productoSeleccionado || !this.validarCantidad()) {
      this.mensajeError = 'Por favor verifica los datos del producto';
      return;
    }

    // Verificar si el producto ya está en la lista
    const productoExistente = this.movimiento.detalles.find(
      d => d.id_producto === this.productoTemp.id_producto
    );

    if (productoExistente) {
      this.mensajeError = 'Este producto ya está en la lista';
      return;
    }

    // Agregar el producto a la lista
    this.movimiento.detalles.push({...this.productoTemp});
    
    // Limpiar la selección actual
    this.productoSeleccionado = null;
    this.productoSeleccionadoId = 0;
    this.productoTemp = {
      id_producto: 0,
      cantidad: 1
    };
    this.mensajeError = '';
  }

  eliminarProducto(index: number) {
    this.movimiento.detalles.splice(index, 1);
  }

  editarCantidad(index: number, cantidad: number) {
    const detalle = this.movimiento.detalles[index];
    const producto = this.productos.find(p => p.id === detalle.id_producto);
    
    if (producto && cantidad > 0 && cantidad <= producto.stock) {
      detalle.cantidad = cantidad;
    }
  }

  registrarSalida() {
    if (this.movimiento.detalles.length === 0) {
      this.mensajeError = 'Agrega al menos un producto';
      return;
    }

    if (!this.movimiento.id_tipo_movimiento) {
      this.mensajeError = 'Selecciona un tipo de movimiento';
      return;
    }

    // Obtener el ID del usuario autenticado
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?.id) {
      this.mensajeError = 'Debes iniciar sesión para registrar una salida';
      return;
    }
    this.movimiento.id_usuario_responsable = currentUser.id;

    this.guardando = true;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.salidaService.registrarSalida(this.movimiento).subscribe({
      next: (response) => {
        this.mensajeExito = 'Salida registrada exitosamente';
        this.mensajeError = '';
        // Actualizar el stock de los productos
        this.cargarProductos();
        // Actualizar historial
        this.cargarHistorialSalidas();
        // Resetear el formulario
        this.resetearFormulario();
        this.guardando = false;
      },
      error: (error) => {
        console.error('Error al registrar salida:', error);
        this.mensajeError = error?.error?.error || 'Error al registrar la salida';
        this.mensajeExito = '';
        this.guardando = false;
      }
    });
  }

  calcularTotal(): number {
    return this.movimiento.detalles.reduce((total, detalle) => total + detalle.cantidad, 0);
  }

  resetearFormulario() {
    this.productoSeleccionado = null;
    this.productoSeleccionadoId = 0;
    this.productoTemp = {
      id_producto: 0,
      cantidad: 1
    };
    this.movimiento = {
      id_tipo_movimiento: 0,
      fecha_movimiento: new Date().toISOString().split('T')[0],
      id_usuario_responsable: 0,
      motivo: '',
      observaciones: '',
      detalles: []
    };
  }
}
