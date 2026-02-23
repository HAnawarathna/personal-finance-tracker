import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Auth } from './auth';

export interface TransactionModel {
  id?: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  categoryId: string;
  categoryName?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class Transaction {
  private auth = inject(Auth);
  private readonly STORAGE_KEY = 'finance_transactions';

  transactions = signal<TransactionModel[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private getFromStorage(): TransactionModel[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveToStorage(transactions: TransactionModel[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(transactions));
  }

  private generateId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTransactions(force = false): Observable<TransactionModel[]> {
    if (!force && this.transactions().length > 0) {
      return of(this.transactions());
    }

    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load transactions.');
      return of([]);
    }

    this.loading.set(true);
    this.error.set(null);
    
    const transactions = this.getFromStorage();
    this.transactions.set(transactions);
    this.loading.set(false);
    
    return of(transactions).pipe(delay(100));
  }

  createTransaction(payload: Omit<TransactionModel, 'id' | 'categoryName' | 'createdAt' | 'updatedAt'>): Observable<TransactionModel> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to create transactions.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const transactions = this.getFromStorage();
    const newTransaction: TransactionModel = {
      ...payload,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    transactions.unshift(newTransaction);
    this.saveToStorage(transactions);
    this.transactions.update((items) => [newTransaction, ...items]);
    this.loading.set(false);
    
    return of(newTransaction).pipe(delay(100));
  }

  updateTransaction(id: string, payload: Partial<TransactionModel>): Observable<TransactionModel> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to update transactions.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const transactions = this.getFromStorage();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) {
      this.loading.set(false);
      return throwError(() => new Error('Transaction not found'));
    }
    
    const updatedTransaction = {
      ...transactions[index],
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    transactions[index] = updatedTransaction;
    this.saveToStorage(transactions);
    this.transactions.update((items) =>
      items.map((item) => (item.id === id ? updatedTransaction : item))
    );
    this.loading.set(false);
    
    return of(updatedTransaction).pipe(delay(100));
  }

  deleteTransaction(id: string): Observable<void> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to delete transactions.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const transactions = this.getFromStorage();
    const filtered = transactions.filter((item) => item.id !== id);
    
    this.saveToStorage(filtered);
    this.transactions.update((items) => items.filter((item) => item.id !== id));
    this.loading.set(false);
    
    return of(void 0).pipe(delay(100));
  }
}
