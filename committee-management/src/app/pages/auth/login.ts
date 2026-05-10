import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  isLoading = false;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.cdr.detectChanges();
    let timedOut = false;
    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      this.isLoading = false;
      this.error = 'Authentication is taking too long. Please try again.';
      this.cdr.detectChanges();
    }, 15000);

    try {
      const signInPromise = this.authService.signIn(this.email, this.password);

      signInPromise
        .then(({ error }) => {
          if (timedOut) {
            return;
          }

          if (error) {
            this.error = error.includes('429') || error.toLowerCase().includes('too many')
              ? 'Too many sign-in attempts. Please wait a moment and try again.'
              : error;
          } else {
            this.router.navigate(['/dashboard']);
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        })
        .catch((err: any) => {
          if (timedOut) {
            return;
          }

          this.error = err?.message || 'Sign in failed';
          this.isLoading = false;
          this.cdr.detectChanges();
        });
    } catch (err: any) {
      if (timedOut) {
        return;
      }
      this.error = err?.message || 'Sign in failed';
      this.isLoading = false;
      this.cdr.detectChanges();
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
