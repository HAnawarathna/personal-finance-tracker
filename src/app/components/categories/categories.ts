import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService, Category } from '../../services/category';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories implements OnInit {
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  categories = this.categoryService.categories;
  loading = this.categoryService.loading;
  error = this.categoryService.error;
  
  showModal = signal(false);
  editingCategory = signal<Category | null>(null);
  isEditing = computed(() => this.editingCategory() !== null);

  incomeCategories = computed(() => 
    this.categories().filter(cat => cat.type === 'income')
  );
  
  expenseCategories = computed(() => 
    this.categories().filter(cat => cat.type === 'expense')
  );

  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    type: ['expense' as 'income' | 'expense', Validators.required],
    color: ['#3b82f6'],
    icon: ['💰'],
  });

  colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  iconOptions = [
    '💰', '🏠', '🚗', '🍔', '🎮', '💊', '🎓', '✈️',
    '👕', '📱', '💡', '🎬', '📚', '🎵', '🏋️', '🎨'
  ];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe();
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.categoryForm.reset({
      name: '',
      type: 'expense',
      color: '#3b82f6',
      icon: '💰',
    });
    this.showModal.set(true);
  }

  openEditModal(category: Category): void {
    this.editingCategory.set(category);
    this.categoryForm.patchValue({
      name: category.name,
      type: category.type,
      color: category.color || '#3b82f6',
      icon: category.icon || '💰',
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingCategory.set(null);
    this.categoryForm.reset();
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    const formValue = this.categoryForm.value;
    const categoryData = {
      name: formValue.name!,
      type: formValue.type!,
      color: formValue.color!,
      icon: formValue.icon!,
    };

    const editing = this.editingCategory();
    if (editing && editing.id) {
      this.categoryService.updateCategory(editing.id, categoryData).subscribe({
        next: () => this.closeModal(),
      });
    } else {
      this.categoryService.createCategory(categoryData).subscribe({
        next: () => this.closeModal(),
      });
    }
  }

  deleteCategory(category: Category): void {
    if (!category.id) return;
    
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      this.categoryService.deleteCategory(category.id).subscribe();
    }
  }
}
