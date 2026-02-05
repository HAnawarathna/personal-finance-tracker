import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/budgets';
  
  budgets = signal<Budget[]>([]);
  alerts = signal<BudgetAlert[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  getBudgets(): Observable<Budget[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<Budget[]>(this.apiUrl).pipe(
      tap({
        next: (budgets) => {
          this.budgets.set(budgets);
          this.calculateAlerts(budgets);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load budgets');
          this.loading.set(false);
        },
      })
    );
  }

  getBudget(id: string): Observable<Budget> {
    return this.http.get<Budget>(`${this.apiUrl}/${id}`);
  }

  createBudget(budget: Omit<Budget, 'id'>): Observable<Budget> {
    this.loading.set(true);
    return this.http.post<Budget>(this.apiUrl, budget).pipe(
      tap({
        next: (newBudget) => {
          this.budgets.update(budgets => [...budgets, newBudget]);
          this.calculateAlerts(this.budgets());
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to create budget');
          this.loading.set(false);
        },
      })
    );
  }

  updateBudget(id: string, budget: Partial<Budget>): Observable<Budget> {
    this.loading.set(true);
    return this.http.put<Budget>(`${this.apiUrl}/${id}`, budget).pipe(
      tap({
        next: (updatedBudget) => {
          this.budgets.update(budgets => 
            budgets.map(b => b.id === id ? updatedBudget : b)
          );
          this.calculateAlerts(this.budgets());
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to update budget');
          this.loading.set(false);
        },
      })
    );
  }

  deleteBudget(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => {
          this.budgets.update(budgets => budgets.filter(b => b.id !== id));
          this.calculateAlerts(this.budgets());
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to delete budget');
          this.loading.set(false);
        },
      })
    );
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
