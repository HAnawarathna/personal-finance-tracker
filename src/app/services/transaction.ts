import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, catchError, finalize, of, shareReplay, tap } from 'rxjs';
import { Auth } from './auth';
import { toUserMessage } from './api-errors';

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
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private apiUrl = 'http://localhost:3000/api/transactions';
  private inFlight: Observable<TransactionModel[]> | null = null;

  transactions = signal<TransactionModel[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  getTransactions(force = false): Observable<TransactionModel[]> {
    if (!force && this.transactions().length > 0) {
      return of(this.transactions());
    }

    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load transactions.');
      return of([]);
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    this.loading.set(true);
    this.error.set(null);
    this.inFlight = this.http.get<TransactionModel[]>(this.apiUrl).pipe(
      tap((transactions) => this.transactions.set(transactions)),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to load transactions'));
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

  createTransaction(payload: Omit<TransactionModel, 'id' | 'categoryName' | 'createdAt' | 'updatedAt'>): Observable<TransactionModel> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to create transactions.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.post<TransactionModel>(this.apiUrl, payload).pipe(
      tap((created) => {
        this.transactions.update((items) => [created, ...items]);
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to create transaction'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
    );
  }

  updateTransaction(id: string, payload: Partial<TransactionModel>): Observable<TransactionModel> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to update transactions.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.put<TransactionModel>(`${this.apiUrl}/${id}`, payload).pipe(
      tap((updated) => {
        this.transactions.update((items) =>
          items.map((item) => (item.id === id ? updated : item))
        );
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to update transaction'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
    );
  }

  deleteTransaction(id: string): Observable<void> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to delete transactions.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.transactions.update((items) => items.filter((item) => item.id !== id));
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to delete transaction'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
    );
  }
}
