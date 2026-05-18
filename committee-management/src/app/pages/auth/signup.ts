import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss'],
})
export class SignupComponent implements OnInit {
  email = '';
  password = '';
  passwordConfirm = '';
  displayName = '';
  isLoading = false;
  error: string | null = null;
  success: string | null = null;

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
    this.error = null;
    this.success = null;

    // Validation
    if (!this.email || !this.password || !this.passwordConfirm) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.password !== this.passwordConfirm) {
      this.error = 'Passwords do not match';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const { error } = await this.authService.signUp(
        this.email,
        this.password,
        this.displayName
      );

      if (error) {
        this.error = error.includes('429') || error.toLowerCase().includes('too many')
          ? 'Too many signup attempts. Please wait a moment and try again.'
          : error;
      } else {
        this.success = 'Sign up successful! Redirecting to dashboard...';
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      }
    } catch (err: any) {
      this.error = err?.message || 'Sign up failed';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
