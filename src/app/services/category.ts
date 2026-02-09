import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, EMPTY, catchError, finalize, of, shareReplay, tap } from 'rxjs';
import { Auth } from './auth';
import { toUserMessage } from './api-errors';

export interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private http = inject(HttpClient);
  private auth = inject(Auth);
  private apiUrl = 'http://localhost:3000/api/categories';
  private inFlight: Observable<Category[]> | null = null;
  
  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  getCategories(force = false): Observable<Category[]> {
    if (!force && this.categories().length > 0) {
      return of(this.categories());
    }

    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load categories.');
      return of([]);
    }

    if (this.inFlight) {
      return this.inFlight;
    }

    this.loading.set(true);
    this.error.set(null);
    this.inFlight = this.http.get<Category[]>(this.apiUrl).pipe(
      tap((categories) => this.categories.set(categories)),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to load categories'));
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

  getCategory(id: string): Observable<Category> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load categories.');
      return EMPTY;
    }

    return this.http.get<Category>(`${this.apiUrl}/${id}`).pipe(
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to load category'));
        return EMPTY;
      })
    );
  }

  createCategory(category: Omit<Category, 'id'>): Observable<Category> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to create categories.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.post<Category>(this.apiUrl, category).pipe(
      tap((newCategory) => {
        this.categories.update((cats) => [...cats, newCategory]);
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to create category'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
    );
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to update categories.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category).pipe(
      tap((updatedCategory) => {
        this.categories.update((cats) =>
          cats.map((c) => (c.id === id ? updatedCategory : c))
        );
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to update category'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
    );
  }

  deleteCategory(id: string): Observable<void> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to delete categories.');
      return EMPTY;
    }

    this.loading.set(true);
    this.error.set(null);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.categories.update((cats) => cats.filter((c) => c.id !== id));
      }),
      catchError((err) => {
        this.error.set(toUserMessage(err, 'Failed to delete category'));
        return EMPTY;
      }),
      finalize(() => this.loading.set(false))
    );
  }
}
