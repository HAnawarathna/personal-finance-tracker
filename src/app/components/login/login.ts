import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = '';
  password = '';
  error = '';

  constructor(private router: Router) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password.';
      return;
    }

    // TEMP: frontend-only login (later we connect backend JWT)
    this.error = '';
    this.router.navigate(['/dashboard']);
  }
}
