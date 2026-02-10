import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BudgetService, Budget as BudgetModel } from '../../services/budget';
import { CategoryService } from '../../services/category';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './budget.html',
  styleUrl: './budget.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Budget implements OnInit {
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private fb = inject(FormBuilder);

  budgets = this.budgetService.budgets;
  alerts = this.budgetService.alerts;
  categories = this.categoryService.categories;
  loading = this.budgetService.loading;
  error = this.budgetService.error;
  
  showModal = signal(false);
  editingBudget = signal<BudgetModel | null>(null);
  isEditing = computed(() => this.editingBudget() !== null);

  totalBudget = computed(() => 
    this.budgets().reduce((sum, budget) => sum + budget.amount, 0)
  );

  totalSpent = computed(() => 
    this.budgets().reduce((sum, budget) => sum + (budget.spent || 0), 0)
  );

  totalRemaining = computed(() => this.totalBudget() - this.totalSpent());

  budgetForm = this.fb.group({
    categoryId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    period: ['monthly' as 'monthly' | 'yearly', Validators.required],
    startDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.categoryService.getCategories().subscribe();
    this.budgetService.getBudgets().subscribe();
  }

  openCreateModal(): void {
    this.editingBudget.set(null);
    const today = new Date().toISOString().split('T')[0];
    this.budgetForm.reset({
      categoryId: '',
      amount: 0,
      period: 'monthly',
      startDate: today,
    });
    this.showModal.set(true);
  }

  openEditModal(budget: BudgetModel): void {
    this.editingBudget.set(budget);
    this.budgetForm.patchValue({
      categoryId: budget.categoryId,
      amount: budget.amount,
      period: budget.period,
      startDate: budget.startDate,
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingBudget.set(null);
    this.budgetForm.reset();
  }

  saveBudget(): void {
    if (this.budgetForm.invalid) return;

    const formValue = this.budgetForm.value;
    const budgetData = {
      categoryId: formValue.categoryId!,
      amount: formValue.amount!,
      period: formValue.period!,
      startDate: formValue.startDate!,
    };

    const editing = this.editingBudget();
    if (editing && editing.id) {
      this.budgetService.updateBudget(editing.id, budgetData).subscribe({
        next: () => this.closeModal(),
      });
    } else {
      this.budgetService.createBudget(budgetData).subscribe({
        next: () => this.closeModal(),
      });
    }
  }

  deleteBudget(budget: BudgetModel): void {
    if (!budget.id) return;
    
    const categoryName = budget.categoryName || 'this budget';
    if (confirm(`Are you sure you want to delete the budget for "${categoryName}"?`)) {
      this.budgetService.deleteBudget(budget.id).subscribe();
    }
  }

  getPercentage(budget: BudgetModel): number {
    if (budget.amount === 0) return 0;
    return Math.min(((budget.spent || 0) / budget.amount) * 100, 100);
  }

  getProgressClass(percentage: number): string {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }
}
