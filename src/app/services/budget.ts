import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, catchError, finalize, of, shareReplay, tap } from 'rxjs';
import { Auth } from './auth';
import { toUserMessage } from './api-errors';

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
  private auth = inject(Auth);
  private apiUrl = 'http://localhost:3000/api/budgets';
  private inFlight: Observable<Budget[]> | null = null;
  
  budgets = signal<Budget[]>([]);
  alerts = signal<BudgetAlert[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  getBudgets(force = false): Observable<Budget[]> {
    if (!force && this.budgets().length > 0) {
      return of(this.budgets());
    }

    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load budgets.');
      return of([]);
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    this.loading.set(true);
    this.error.set(null);
    this.inFlight = this.http.get<Budget[]>(this.apiUrl).pipe(
      tap((budgets) => {
        this.budgets.set(budgets);
        this.calculateAlerts(budgets);
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to load budgets'));
        return of([]);
      }),
      finalize(() => {
        this.loading.set(false);
        this.inFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    return this.inFlight;
  }

  getBudget(id: string): Observable<Budget> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load budgets.');
      return EMPTY;
    }

    return this.http.get<Budget>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to load budget'));
        return EMPTY;
      })
    );
  }

  createBudget(budget: Omit<Budget, 'id'>): Observable<Budget> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to create budgets.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.post<Budget>(this.apiUrl, budget).pipe(
      tap((newBudget) => {
        this.budgets.update((budgets) => [...budgets, newBudget]);
        this.calculateAlerts(this.budgets());
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to create budget'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
    );
  }

  updateBudget(id: string, budget: Partial<Budget>): Observable<Budget> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to update budgets.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.put<Budget>(`${this.apiUrl}/${id}`, budget).pipe(
      tap((updatedBudget) => {
        this.budgets.update((budgets) =>
          budgets.map((b) => (b.id === id ? updatedBudget : b))
        );
        this.calculateAlerts(this.budgets());
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to update budget'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
    );
  }

  deleteBudget(id: string): Observable<void> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to delete budgets.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.budgets.update((budgets) => budgets.filter((b) => b.id !== id));
        this.calculateAlerts(this.budgets());
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to delete budget'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
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
