import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../Models/Producto';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  showFormModal = false;
  showDeleteModal = false;
  searchTerm = '';
  selectedCategory = 'all';

  selectedProduct: any = null;
  productToDelete: any = null;
  editingProduct: any = {};
  isLoading = false;
  showSuccessMessage = false;
  showErrorMessage = false;
  errorMessage = '';

  products: any[] = [];
  categoriasDisponibles: any[] = [];
  proveedoresDisponibles: string[] = [];
  
  private categoriaMap: Map<number, string> = new Map();

  constructor(private productoService: ProductoService) {}

  ngOnInit(): void {
    this.productoService.obtenerCategorias().subscribe({
      next: (data) => {
        this.categoriasDisponibles = data;
        data.forEach(cat => {
          this.categoriaMap.set(cat.idcategoria, cat.nombre);
        });
        this.cargarProductos();
      },
      error: () => {
        this.showErrorMessage = true;
        this.errorMessage = 'No se pudieron cargar las categorías. Por favor, recargue la página.';
      }
    });

    this.productoService.obtenerProveedores().subscribe({
      next: (data) => this.proveedoresDisponibles = data
    });
  }

  cargarProductos(): void {
    this.productoService.obtenerProductos().subscribe({
      next: (data) => {
        this.products = data.map(p => ({
          ...p,
          id_display: p.id.toString().padStart(3, '0'),
          categoryName: this.mapCategoria(p.idcategoria)
        }));
      },
      error: () => {
        this.showErrorMessage = true;
        this.errorMessage = 'No se pudieron cargar los productos.';
      }
    });
  }

  mapCategoria(id: number): string {
    return this.categoriaMap.get(id) || 'Sin categoría';
  }

  getStockStatus(stock: number): string {
    // Nuevo comportamiento: >10 => 'Disponible', <=10 and >0 => 'Pocas unidades', 0 => 'Sin Stock'
    if (stock === 0) return 'Sin Stock';
    if (stock > 10) return 'Disponible';
    return 'Pocas unidades';
  }

  getStockColor(stock: number): string {
    if (stock === 0) return 'text-red-600';
    if (stock > 10) return 'text-green-600';
    return 'text-yellow-600';
  }

  get filteredProducts() {
    return this.products.filter(product => {
      const matchesSearch =
        product.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCategory =
        this.selectedCategory === 'all' || product.categoryName === this.selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }

  openNewModal(): void {
    this.selectedProduct = null;
    this.editingProduct = {
      name: '',
      sku: '',
      description: '',
      price: null,
      stock: null,
      provider: '',
      idcategoria: null,
    };
    this.showFormModal = true;
  }

  openEditModal(product: any): void {
    this.selectedProduct = product;
    this.editingProduct = { ...product };
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
    this.selectedProduct = null;
    this.editingProduct = {};
    this.clearMessages();
  }

  clearMessages(): void {
    this.showSuccessMessage = false;
    this.showErrorMessage = false;
    this.errorMessage = '';
  }

  validateProduct(product: any): string | null {
    const missingFields: string[] = [];

    if (!product.name?.trim()) missingFields.push('Nombre');
    if (!product.sku?.trim()) missingFields.push('Código SKU');
    if (!product.idcategoria) missingFields.push('Categoría');
    if (!product.provider?.trim()) missingFields.push('Proveedor');
    if (product.price == null || product.price < 0) missingFields.push('Precio');
    if (product.stock == null || product.stock < 0) missingFields.push('Stock');

    if (missingFields.length > 0) {
      return `Debe completar los siguientes campos: ${missingFields.join(', ')}.`;
    }
    
    return null;
  }

  saveProduct(): void {
    this.clearMessages();
    const validationError = this.validateProduct(this.editingProduct);
    if (validationError) {
      this.showErrorMessage = true;
      this.errorMessage = validationError;
      return;
    }

    this.isLoading = true;

    const productoParaGuardar = {
      sku: this.editingProduct.sku,
      name: this.editingProduct.name,
      descripcion: this.editingProduct.description || null,
      price: this.editingProduct.price,
      provider: this.editingProduct.provider,
      stock: this.editingProduct.stock,
      stockminimo: 4,
      idcategoria: this.editingProduct.idcategoria
    };

    if (this.selectedProduct) {
      // LÓGICA PARA ACTUALIZAR (EDITAR)
      this.productoService.actualizarProducto(this.selectedProduct.id, productoParaGuardar).subscribe({
        next: () => {
          this.showSuccessMessage = true;
          this.closeModal();
          this.cargarProductos();
        },
        error: (err) => {
          this.showErrorMessage = true;
          this.errorMessage = 'Error al actualizar el producto. Verifique los datos.';
          console.error(err);
        },
        complete: () => this.isLoading = false
      });
    } else {
      // LÓGICA PARA CREAR (NUEVO)
      this.productoService.guardarProducto(productoParaGuardar).subscribe({
        next: () => {
          this.showSuccessMessage = true;
          this.closeModal();
          this.cargarProductos();
        },
        error: (err) => {
          this.showErrorMessage = true;
          this.errorMessage = 'Error al guardar el producto. Verifique los datos.';
          console.error(err);
        },
        complete: () => this.isLoading = false
      });
    }
  }

  openDeleteModal(product: any): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  confirmDeleteProduct(): void {
    if (!this.productToDelete) return;
    
    this.isLoading = true;
    const id = this.productToDelete.id;

    this.productoService.eliminarProducto(id).subscribe({
      next: () => {
        this.showSuccessMessage = true;
        this.cargarProductos();
      },
      error: (err) => {
        this.showErrorMessage = true;
        this.errorMessage = 'Error al eliminar el producto.';
        console.error(err);
      },
      complete: () => {
        this.isLoading = false;
        this.closeDeleteModal();
      }
    });
  }
}