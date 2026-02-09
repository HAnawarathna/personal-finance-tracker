import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private router = inject(Router);

  username = '';
  password = '';
  error = '';

  onLogin() {
    if (!this.username || !this.password) {
      this.error = 'Please enter username and password.';
      return;
    }

    // TEMP: frontend-only login (later we connect backend JWT)
    this.error = '';
    this.router.navigate(['/dashboard']);
  }
}
