// Angular Core
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

// Third-party libraries
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Application services
import { ProductoService } from '../../services/producto.service';
import { SalidaService } from '../../services/salida.service';
import { IncidenciaService } from '../../services/incidencia.service';
import { ReporteService } from '../../services/reporte.service';
import { AuthService } from '../../services/auth.service';
import { DashboardService, DashboardStats } from '../../services/dashboard.service';

// Constants
import { API_CONFIG } from '../../constants/app.constants';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  stats = [
    { title: 'Ingresos Totales', value: '-', change: '', changeType: 'positive', color: 'bg-green-100 text-green-700' },
    { title: 'Productos en Inventario', value: '-', change: '', changeType: 'positive', color: 'bg-blue-100 text-blue-700' },
    { title: 'Stock Crítico', value: '-', change: '', changeType: 'negative', color: 'bg-orange-100 text-orange-700' },
    { title: 'Salidas de Inventario', value: '-', change: '', changeType: 'positive', color: 'bg-red-100 text-red-700' }
  ];
  reportes: any[] = [];
  serverBase = API_CONFIG.BASE_URL;
  isLoading = false;
  recentProducts: any[] = [];

  constructor(
    private productoSvc: ProductoService,
    private salidaSvc: SalidaService,
    private incidenciaSvc: IncidenciaService,
    private reporteSvc: ReporteService,
    private dashboardSvc: DashboardService,
    private authSvc: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadReportes();
  }

  ngOnDestroy(): void {
    // No auto refresh
  }

  private formatCurrency(n: number): string {
    try {
      return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(n || 0);
    } catch {
      return `S/ ${ (n || 0).toFixed(2) }`;
    }
  }

  private pctChange(curr: number, prev: number): { text: string; type: 'positive' | 'negative' } {
    if (!prev || prev === 0) return { text: '+0.0%', type: 'positive' };
    const pct = ((curr - prev) / prev) * 100;
    const text = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    return { text, type: pct >= 0 ? 'positive' as const : 'negative' as const };
  }

  private loadStats() {
    this.isLoading = true;
    this.dashboardSvc.getStats().subscribe({
      next: (s: DashboardStats) => {
        console.log('Dashboard stats received:', s);
        const ingresos = s?.ingresos_mes || 0;
        const ingresosPrev = s?.ingresos_mes_anterior || 0;
        const salidas = s?.salidas_mes || 0;
        const salidasPrev = s?.salidas_mes_anterior || 0;
        const productos = s?.productos_activos || 0;
        const criticos = s?.stock_critico || 0;

        // Para ingresos totales (valor inventario), no mostramos cambio porcentual
        const chIng = { text: '', type: 'positive' as const };
        const chSal = this.pctChange(salidas, salidasPrev);

        this.stats = [
          { title: 'Ingresos Totales', value: this.formatCurrency(ingresos), change: chIng.text, changeType: chIng.type, color: 'bg-green-100 text-green-700' },
          { title: 'Productos en Inventario', value: String(productos), change: '', changeType: 'positive', color: 'bg-blue-100 text-blue-700' },
          { title: 'Stock Crítico', value: String(criticos), change: '', changeType: 'negative', color: 'bg-orange-100 text-orange-700' },
          { title: 'Salidas de Inventario', value: String(salidas), change: chSal.text, changeType: chSal.type, color: 'bg-red-100 text-red-700' }
        ];
        this.isLoading = false;
        console.log('Dashboard stats updated:', this.stats);
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        // En caso de error, mantener los placeholders
        this.isLoading = false;
      }
    });
  }

  // Llamado por botón "Actualizar"
  refreshStats(): void {
    console.log('Refreshing dashboard stats...');
    this.loadStats();
    this.loadReportes();
  }

  private loadReportes() {
    this.reporteSvc.listarReportes(20).subscribe({
      next: (rows) => {
        const list = (rows || []).map((r: any) => {
          let params = r.parametros;
          if (typeof params === 'string') {
            try { params = JSON.parse(params); } catch { /* ignore */ }
          }
          const displayParams = params?.subtipo || params?.filtro || '';
          return { ...r, parametros: params, displayParams };
        });
        this.reportes = list;
      },
      error: () => {
        this.reportes = [];
      }
    });
  }

  // Utilidad para descargar y guardar en servidor
  private saveAndStore(doc: jsPDF, filename: string, tipo: 'Inventario Actual' | 'Movimientos' | 'Reporte Estadístico' | 'Top Productos (Salidas)', parametros?: any) {
    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1];
    // Descargar en el navegador
    doc.save(filename);
    // Guardar en el servidor (carpeta backend/reportes)
    // Usar el id del usuario autenticado si existe; fallback a 1
    const currentUser = this.authSvc.getCurrentUser();
    const userId = currentUser?.id ?? 1;
    // Mapear tipos antiguos a enum del backend
    const tipoBackend = tipo === 'Inventario Actual' ? 'Reporte_Productos'
                      : tipo === 'Reporte Estadístico' ? 'Reporte_Incidencia'
                      : tipo === 'Top Productos (Salidas)' ? 'Reporte_Productos_Mayor_Salida'
                      : 'Reporte_Productos'; // Movimientos u otros
    this.reporteSvc.uploadReporte(filename, base64, tipoBackend, userId, parametros).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  // Reporte: Inventario actual (desde productos)
  generarReporteInventarioActual() {
    this.productoSvc.obtenerProductos().subscribe({
      next: (products: any[]) => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text('Inventario - Lista de Productos', 14, 14);
        const head = [[
          'Código', 'Producto', 'Marca', 'Categoría', 'Stock', 'Precio', 'Lote', 'Estado'
        ]];
        const rows = (products || []).map((p: any) => [
          p.codigo_producto || p.sku,
          p.nombre_producto || p.name,
          p.provider || p.nombre_marca || '-',
          p.categoria_nombre || p.categoryName || '-',
          String(p.stock_actual ?? p.stock ?? 0),
          typeof p.precio_unitario !== 'undefined' ? `S/ ${p.precio_unitario}` : (p.price ? `S/ ${p.price}` : 'S/ -'),
          p.lote || (p.id ? `LOT-2024-${String(p.id).padStart(3,'0')}` : '-'),
          p.estado_stock_display || p.estado_stock || '-'
        ]);
        autoTable(doc, { head, body: rows, startY: 20, styles: { fontSize: 9 }, headStyles: { fillColor: [66,66,66] } });
        this.saveAndStore(doc, 'reporte_inventario_actual.pdf', 'Inventario Actual');
      }
    });
  }

  // Reporte: Movimientos (todos)
  generarReporteMovimientos() {
    this.salidaSvc.obtenerMovimientos().subscribe({
      next: (movs: any[]) => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text('Reporte de Movimientos', 14, 14);
        const head = [[ 'Fecha', 'Tipo', 'Código', 'Producto', 'Cantidad', 'Lote', 'Observaciones' ]];
        const rows = (movs || []).map((m: any) => [
          m.fecha_movimiento,
          m.tipo_movimiento,
          m.codigo_producto,
          m.nombre_producto,
          String(m.cantidad),
          m.lote_afectado || '-',
          m.observaciones || ''
        ]);
        autoTable(doc, { head, body: rows, startY: 20, styles: { fontSize: 9 }, headStyles: { fillColor: [66,66,66] } });
        this.saveAndStore(doc, 'reporte_movimientos.pdf', 'Movimientos', { subtipo: 'Movimientos' });
      }
    });
  }

  // Reporte: Estadístico (Incidencias recientes)
  generarReporteEstadistico() {
    this.incidenciaSvc.obtenerHistorial(100).subscribe({
      next: (rows: any[]) => {
        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text('Reporte de Incidencias', 14, 14);
        const head = [[ 'Fecha', 'Tipo', 'Código', 'Producto', 'Cantidad', 'Lote', 'Acción/Obs.' ]];
        const body = (rows || []).map((r: any) => [
          r.fecha_incidencia,
          r.tipo_incidencia,
          r.codigo_producto,
          r.nombre_producto,
          String(r.cantidad_afectada),
          r.lote || '-',
          r.accion_tomada || r.descripcion_detallada || ''
        ]);
        autoTable(doc, { head, body, startY: 20, styles: { fontSize: 9 }, headStyles: { fillColor: [66,66,66] } });
        this.saveAndStore(doc, 'reporte_incidencias.pdf', 'Reporte Estadístico');
      }
    });
  }

  // Reporte: Top productos con más salidas
  generarReporteTopSalidas() {
    this.salidaSvc.obtenerTopSalidas(10).subscribe({
      next: (rows: any[]) => {
        const doc = new jsPDF({ orientation: 'portrait' });
        doc.setFontSize(16);
        doc.text('Top Productos por Salidas', 14, 14);
        const head = [[ 'Código', 'Producto', 'Total Salidas' ]];
        const body = (rows || []).map((r: any) => [
          r.codigo_producto,
          r.nombre_producto,
          String(r.total_salidas)
        ]);
        autoTable(doc, { head, body, startY: 20, styles: { fontSize: 10 }, headStyles: { fillColor: [66,66,66] } });
        // NOTA: la tabla 'reportes' restringe tipo_reporte; registramos como 'Movimientos' con subtipo en parametros
        this.saveAndStore(doc, 'reporte_top_productos_salidas.pdf', 'Top Productos (Salidas)', { subtipo: 'Top Productos (Salidas)' });
      }
    });
  }

  // Optimizadores para *ngFor
  trackByTitle(index: number, item: any): string {
    return item.title;
  }

  trackByName(index: number, item: any): string {
    return item.name;
  }
  
  trackByReporte(index: number, item: any): any {
    return item.id_reporte || item.archivo_ruta || index;
  }
}
