import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Auth } from './auth';

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
  private auth = inject(Auth);
  private readonly STORAGE_KEY = 'finance_categories';
  
  categories = signal<Category[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private getFromStorage(): Category[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      // Return default categories
      const defaults: Category[] = [
        { id: '1', name: 'Salary', type: 'income', color: '#10b981', icon: '💰', createdAt: new Date().toISOString() },
        { id: '2', name: 'Freelance', type: 'income', color: '#3b82f6', icon: '💼', createdAt: new Date().toISOString() },
        { id: '3', name: 'Food', type: 'expense', color: '#ef4444', icon: '🍔', createdAt: new Date().toISOString() },
        { id: '4', name: 'Transport', type: 'expense', color: '#f59e0b', icon: '🚗', createdAt: new Date().toISOString() },
        { id: '5', name: 'Shopping', type: 'expense', color: '#8b5cf6', icon: '🛍️', createdAt: new Date().toISOString() },
        { id: '6', name: 'Bills', type: 'expense', color: '#ec4899', icon: '📄', createdAt: new Date().toISOString() },
      ];
      this.saveToStorage(defaults);
      return defaults;
    }
    return JSON.parse(data);
  }

  private saveToStorage(categories: Category[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(categories));
  }

  private generateId(): string {
    return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCategories(force = false): Observable<Category[]> {
    if (!force && this.categories().length > 0) {
      return of(this.categories());
    }

    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load categories.');
      return of([]);
    }

    this.loading.set(true);
    this.error.set(null);
    
    const categories = this.getFromStorage();
    this.categories.set(categories);
    this.loading.set(false);
    
    return of(categories).pipe(delay(100));
  }

  getCategory(id: string): Observable<Category> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to load categories.');
      return throwError(() => new Error('Not authenticated'));
    }

    const categories = this.getFromStorage();
    const category = categories.find(c => c.id === id);
    
    if (!category) {
      return throwError(() => new Error('Category not found'));
    }
    
    return of(category).pipe(delay(100));
  }

  createCategory(category: Omit<Category, 'id'>): Observable<Category> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to create categories.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const categories = this.getFromStorage();
    const newCategory: Category = {
      ...category,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    categories.push(newCategory);
    this.saveToStorage(categories);
    this.categories.update((cats) => [...cats, newCategory]);
    this.loading.set(false);
    
    return of(newCategory).pipe(delay(100));
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to update categories.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const categories = this.getFromStorage();
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) {
      this.loading.set(false);
      return throwError(() => new Error('Category not found'));
    }
    
    const updatedCategory = {
      ...categories[index],
      ...category,
      id,
      updatedAt: new Date().toISOString(),
    };
    
    categories[index] = updatedCategory;
    this.saveToStorage(categories);
    this.categories.update((cats) =>
      cats.map((c) => (c.id === id ? updatedCategory : c))
    );
    this.loading.set(false);
    
    return of(updatedCategory).pipe(delay(100));
  }

  deleteCategory(id: string): Observable<void> {
    if (!this.auth.getToken()) {
      this.error.set('Please sign in to delete categories.');
      return throwError(() => new Error('Not authenticated'));
    }

    this.loading.set(true);
    this.error.set(null);
    
    const categories = this.getFromStorage();
    const filtered = categories.filter((c) => c.id !== id);
    
    this.saveToStorage(filtered);
    this.categories.update((cats) => cats.filter((c) => c.id !== id));
    this.loading.set(false);
    
    return of(void 0).pipe(delay(100));
  }
}
