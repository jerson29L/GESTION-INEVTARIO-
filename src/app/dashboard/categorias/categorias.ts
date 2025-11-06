import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-categorias',
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css'
})
export class Categorias {
  showFormModal = false;
  selectedCategory: any = null;
  editingCategory: any = {};
  expandedCategories = new Set<string>();

  categories = [
    { id: "1", name: "Libros", description: "Amplia selección de géneros y autores", icon: 'BookOpen', color: "text-green-600", bgColor: "bg-green-100", productCount: 2847, status: "active", subcategories: [{ id: "1-1", name: "Ficción", productCount: 1245 }, { id: "1-2", name: "No Ficción", productCount: 892 }] },
    { id: "2", name: "Cuadernos y Libretas", description: "Para todas tus ideas y proyectos", icon: 'PenTool', color: "text-yellow-600", bgColor: "bg-yellow-100", productCount: 456, status: "active", subcategories: [{ id: "2-1", name: "Cuadernos Rayados", productCount: 156 }] },
    { id: "3", name: "Material de Arte", description: "Todo lo que necesitas para crear", icon: 'Palette', color: "text-purple-600", bgColor: "bg-purple-100", productCount: 789, status: "active", subcategories: [] },
    { id: "4", name: "Juegos de Mesa", description: "Diversión para toda la familia", icon: 'Gamepad2', color: "text-blue-600", bgColor: "bg-blue-100", productCount: 234, status: "active", subcategories: [] },
    { id: "5", name: "Regalos Literarios", description: "Obsequios únicos para lectores", icon: 'Gift', color: "text-pink-600", bgColor: "bg-pink-100", productCount: 921, status: "active", subcategories: [] },
  ];

  toggleCategory(categoryId: string): void {
    if (this.expandedCategories.has(categoryId)) this.expandedCategories.delete(categoryId);
    else this.expandedCategories.add(categoryId);
  }

  isExpanded(categoryId: string): boolean {
    return this.expandedCategories.has(categoryId);
  }

  openNewModal(): void {
    this.selectedCategory = null;
    this.editingCategory = { status: 'active' };
    this.showFormModal = true;
  }

  openEditModal(category: any): void {
    this.selectedCategory = category;
    this.editingCategory = { ...category };
    this.showFormModal = true;
  }

  closeModal(): void {
    this.showFormModal = false;
  }

  saveCategory(): void {
    console.log('Guardando:', this.editingCategory);
    this.closeModal();
  }

  get totalSubcategories(): number { return this.categories.reduce((acc, cat) => acc + (cat.subcategories?.length || 0), 0); }
  get totalProducts(): number { return this.categories.reduce((acc, cat) => acc + cat.productCount, 0); }
  get activeCategoriesCount(): number { return this.categories.filter(cat => cat.status === 'active').length; }
}
