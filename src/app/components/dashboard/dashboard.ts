import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Transaction } from '../../services/transaction';
import { BudgetService } from '../../services/budget';
import { CategoryService } from '../../services/category';
import { Auth } from '../../services/auth';

export interface TransactionModel {
  id?: string;
  type: 'income' | 'expense';
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private transactionService = inject(Transaction);
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private authService = inject(Auth);
  private router = inject(Router);

  transactions = signal<TransactionModel[]>([]);
  budgets = this.budgetService.budgets;
  categories = this.categoryService.categories;
  loading = signal(false);

  recentTransactions = computed(() => 
    this.transactions().slice(0, 5)
  );

  totalIncome = computed(() => 
    this.transactions()
      .filter((t: TransactionModel) => t.type === 'income')
      .reduce((sum: number, t: TransactionModel) => sum + t.amount, 0)
  );

  totalExpense = computed(() => 
    this.transactions()
      .filter((t: TransactionModel) => t.type === 'expense')
      .reduce((sum: number, t: TransactionModel) => sum + t.amount, 0)
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
      .filter((t: TransactionModel) => t.type === 'expense')
      .forEach((t: TransactionModel) => {
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
    // Load mock data for demo
    this.transactions.set([
      {
        id: '1',
        type: 'income',
        categoryId: 'salary',
        amount: 5000,
        description: 'Monthly Salary',
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: '2',
        type: 'expense',
        categoryId: 'food',
        amount: 150,
        description: 'Groceries',
        date: new Date().toISOString().split('T')[0],
      },
      {
        id: '3',
        type: 'expense',
        categoryId: 'transport',
        amount: 50,
        description: 'Gas',
        date: new Date().toISOString().split('T')[0],
      },
    ]);
    this.budgetService.getBudgets().subscribe(() => {
      this.categoryService.getCategories().subscribe(() => {
        this.loading.set(false);
      });
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find(c => c.id === categoryId);
    return category?.name || 'Transfer';
  }
}
