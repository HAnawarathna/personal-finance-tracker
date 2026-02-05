import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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
  private apiUrl = 'http://localhost:3000/api/categories';
  
  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  getCategories(): Observable<Category[]> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<Category[]>(this.apiUrl).pipe(
      tap({
        next: (categories) => {
          this.categories.set(categories);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load categories');
          this.loading.set(false);
        },
      })
    );
  }

  getCategory(id: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  createCategory(category: Omit<Category, 'id'>): Observable<Category> {
    this.loading.set(true);
    return this.http.post<Category>(this.apiUrl, category).pipe(
      tap({
        next: (newCategory) => {
          this.categories.update(cats => [...cats, newCategory]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to create category');
          this.loading.set(false);
        },
      })
    );
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    this.loading.set(true);
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category).pipe(
      tap({
        next: (updatedCategory) => {
          this.categories.update(cats => 
            cats.map(c => c.id === id ? updatedCategory : c)
          );
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to update category');
          this.loading.set(false);
        },
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    this.loading.set(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap({
        next: () => {
          this.categories.update(cats => cats.filter(c => c.id !== id));
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to delete category');
          this.loading.set(false);
        },
      })
    );
  }
}
