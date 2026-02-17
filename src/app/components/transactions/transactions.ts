import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Transaction, TransactionModel } from '../../services/transaction';
import { CategoryService } from '../../services/category';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Transactions implements OnInit {
  private transactionService = inject(Transaction);
  private categoryService = inject(CategoryService);
  private authService = inject(Auth);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  transactions = this.transactionService.transactions;
  categories = this.categoryService.categories;
  loading = this.transactionService.loading;
  error = this.transactionService.error;

  searchQuery = signal('');
  typeFilter = signal<'all' | 'income' | 'expense'>('all');
  categoryFilter = signal<string>('all');
  toastMessage = signal<string | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  transactionForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    type: ['expense' as 'income' | 'expense', Validators.required],
    categoryId: ['', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
  });

  filteredTransactions = computed(() => {
    let filtered = this.transactions();
    
    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter((t) =>
        t.title?.toLowerCase().includes(query) ||
        t.categoryName?.toLowerCase().includes(query)
      );
    }
    
    // Type filter
    const type = this.typeFilter();
    if (type !== 'all') {
      filtered = filtered.filter((t) => t.type === type);
    }
    
    // Category filter
    const categoryId = this.categoryFilter();
    if (categoryId !== 'all') {
      filtered = filtered.filter((t) => t.categoryId === categoryId);
    }
    
    return filtered;
  });

  incomeCategories = computed(() =>
    this.categories().filter((cat) => cat.type === 'income')
  );

  expenseCategories = computed(() =>
    this.categories().filter((cat) => cat.type === 'expense')
  );

  currentCategories = computed(() => {
    const type = this.transactionForm.value.type;
    return type === 'income' ? this.incomeCategories() : this.expenseCategories();
  });

  totalIncome = computed(() =>
    this.transactions()
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  totalExpense = computed(() =>
    this.transactions()
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  balance = computed(() => this.totalIncome() - this.totalExpense());

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.categoryService.getCategories().subscribe();
    this.transactionService.getTransactions().subscribe();
  }

  onTypeChange(): void {
    this.transactionForm.patchValue({ categoryId: '' });
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      this.transactionForm.markAllAsTouched();
      return;
    }

    const formValue = this.transactionForm.value;
    const payload = {
      title: formValue.title!,
      amount: formValue.amount!,
      type: formValue.type!,
      categoryId: formValue.categoryId!,
      date: formValue.date!,
    };

    this.transactionService.createTransaction(payload).subscribe({
      next: () => {
        this.transactionForm.reset({
          title: '',
          amount: 0,
          type: 'expense',
          categoryId: '',
          date: new Date().toISOString().split('T')[0],
        });
        this.showToast('Transaction added successfully!');
      },
    });
  }

  clearForm(): void {
    this.transactionForm.reset({
      title: '',
      amount: 0,
      type: 'expense',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
    });
  }

  deleteTransaction(transaction: TransactionModel): void {
    if (!transaction.id) return;

    if (confirm(`Are you sure you want to delete "${transaction.title}"?`)) {
      this.transactionService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          this.showToast('Transaction deleted successfully.');
        },
      });
    }
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories().find((c) => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  getCategoryIcon(categoryId: string): string {
    const category = this.categories().find((c) => c.id === categoryId);
    return category?.icon || '💰';
  }

  formatAmount(amount: number, type: 'income' | 'expense'): string {
    const sign = type === 'income' ? '+' : '-';
    return `${sign} $${amount.toFixed(2)}`;
  }

  logout(): void {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.clearToken();
      this.router.navigate(['/login']);
    }
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = null;
    }, 3000);
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }
}
