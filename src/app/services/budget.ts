import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Auth } from './auth';

export interface Budget {
  id?: string;
  categoryId: string;
  categoryName?: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  spent?: number;
  remaining?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
  severity: 'warning' | 'danger';
}

@Injectable({
  providedIn: 'root',
})
export class BudgetService {
  private auth = inject(Auth);
  private readonly STORAGE_KEY = 'finance_budgets';
  
  budgets = signal<Budget[]>([]);
  alerts = signal<BudgetAlert[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private getFromStorage(): Budget[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(budgets: Budget[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(budgets));
  }

  private generateId(): string {
    return `bud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getBudgets(force = false): Observable<Budget[]> {
    if (!force && this.budgets().length > 0) {
      return of(this.budgets());
    }

    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load budgets.');
      return of([]);
    }

    this.loading.set(true);
    this.error.set(null);
    
    const budgets = this.getFromStorage();
    this.budgets.set(budgets);
    this.calculateAlerts(budgets);
    this.loading.set(false);
    
    return of(budgets).pipe(delay(100));
  }

  getBudget(id: string): Observable<Budget> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load budgets.');
      return throwError(() => new Error('Not authenticated'));
    }

    const budgets = this.getFromStorage();
    const budget = budgets.find(b => b.id === id);
    
    if (!budget) {
      return throwError(() => new Error('Budget not found'));
    }
    
    return of(budget).pipe(delay(100));
  }

  createBudget(budget: Omit<Budget, 'id'>): Observable<Budget> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to create budgets.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const budgets = this.getFromStorage();
    const newBudget: Budget = {
      ...budget,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    budgets.push(newBudget);
    this.saveToStorage(budgets);
    this.budgets.update((b) => [...b, newBudget]);
    this.calculateAlerts(this.budgets());
    this.loading.set(false);
    
    return of(newBudget).pipe(delay(100));
  }

  updateBudget(id: string, budget: Partial<Budget>): Observable<Budget> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to update budgets.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const budgets = this.getFromStorage();
    const index = budgets.findIndex(b => b.id === id);
    
    if (index === -1) {
      this.loading.set(false);
      return throwError(() => new Error('Budget not found'));
    }
    
    const updatedBudget = {
      ...budgets[index],
      ...budget,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    budgets[index] = updatedBudget;
    this.saveToStorage(budgets);
    this.budgets.update((b) =>
      b.map((item) => (item.id === id ? updatedBudget : item))
    );
    this.calculateAlerts(this.budgets());
    this.loading.set(false);
    
    return of(updatedBudget).pipe(delay(100));
  }

  deleteBudget(id: string): Observable<void> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to delete budgets.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const budgets = this.getFromStorage();
    const filtered = budgets.filter((b) => b.id !== id);
    
    this.saveToStorage(filtered);
    this.budgets.update((b) => b.filter((item) => item.id !== id));
    this.calculateAlerts(this.budgets());
    this.loading.set(false);
    
    return of(void 0).pipe(delay(100));
  }

  private calculateAlerts(budgets: Budget[]): void {
    const alerts: BudgetAlert[] = [];
    
    budgets.forEach(budget => {
      const spent = budget.spent || 0;
      // Prevent division by zero
      if (budget.amount <= 0) return;
      
      const percentage = (spent / budget.amount) * 100;
      
      if (percentage >= 80) {
        alerts.push({
          categoryId: budget.categoryId,
          categoryName: budget.categoryName || 'Unknown',
          budgetAmount: budget.amount,
          spent,
          percentage,
          severity: percentage >= 100 ? 'danger' : 'warning',
        });
      }
    });
    
    this.alerts.set(alerts);
  }
}
