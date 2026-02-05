import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../services/transaction';
import { BudgetService } from '../../services/budget';
import { CategoryService } from '../../services/category';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private transactionService = inject(TransactionService);
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);

  transactions = this.transactionService.transactions;
  budgets = this.budgetService.budgets;
  categories = this.categoryService.categories;
  loading = signal(false);

  recentTransactions = computed(() => 
    this.transactions().slice(0, 5)
  );

  totalIncome = computed(() => 
    this.transactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  totalExpense = computed(() => 
    this.transactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  balance = computed(() => this.totalIncome() - this.totalExpense());

  budgetStatus = computed(() => 
    this.budgets().map(b => ({
      ...b,
      percentage: b.amount ? Math.min(((b.spent || 0) / b.amount) * 100, 100) : 0,
    })).slice(0, 5)
  );

  categoryBreakdown = computed(() => {
    const breakdown: { [key: string]: number } = {};
    this.transactions()
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const category = this.categories().find(c => c.id === t.categoryId);
        const name = category?.name || 'Other';
        breakdown[name] = (breakdown[name] || 0) + t.amount;
      });
    return Object.entries(breakdown)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.transactionService.getTransactions().subscribe(() => {
      this.budgetService.getBudgets().subscribe(() => {
        this.categoryService.getCategories().subscribe(() => {
          this.loading.set(false);
        });
      });
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.icon || '💰';
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  }
}
