import { Routes } from '@angular/router';

import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { Dashboard } from './components/dashboard/dashboard';
import { Transactions } from './components/transactions/transactions';
import { Categories } from './components/categories/categories';
import { Budget } from './components/budget/budget';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'register', component: Register },

  { path: 'dashboard', component: Dashboard },
  { path: 'transactions', component: Transactions },
  { path: 'categories', component: Categories },
  { path: 'budget', component: Budget },
];
