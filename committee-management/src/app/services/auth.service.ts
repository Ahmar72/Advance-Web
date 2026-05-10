import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.initializeAuth();
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs = 15000, timeoutMessage = 'Auth request timed out') {
    let timeoutHandle: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  /**
   * Initialize auth state from Supabase session
   */
  private initializeAuth() {
    this.supabaseService.onAuthStateChange((event, session) => {
      if (session) {
        this.currentUserSubject.next(session.user);
        this.isAuthenticatedSubject.next(true);
      } else {
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      }
    });
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, displayName?: string) {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const { data, error } = await this.withTimeout(
        this.supabaseService.signUp(email, password, {
          display_name: displayName || email.split('@')[0],
        })
      );

      if (error) {
        throw new Error(error.message);
      }

      this.currentUserSubject.next(data.user);
      this.isAuthenticatedSubject.next(true);
      this.loadingSubject.next(false);

      return { user: data.user, error: null };
    } catch (err: any) {
      const errorMsg = err.message || 'Sign up failed';
      this.errorSubject.next(errorMsg);
      this.loadingSubject.next(false);
      return { user: null, error: errorMsg };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      this.loadingSubject.next(true);
      this.errorSubject.next(null);

      const { data, error } = await this.withTimeout(this.supabaseService.signIn(email, password));

      if (error) {
        throw new Error(error.message);
      }

      this.currentUserSubject.next(data.user);
      this.isAuthenticatedSubject.next(true);
      this.loadingSubject.next(false);

      return { user: data.user, error: null };
    } catch (err: any) {
      const errorMsg = err.message || 'Sign in failed';
      this.errorSubject.next(errorMsg);
      this.loadingSubject.next(false);
      return { user: null, error: errorMsg };
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      this.loadingSubject.next(true);
      await this.supabaseService.signOut();
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      this.loadingSubject.next(false);
      return { error: null };
    } catch (err: any) {
      const errorMsg = err.message || 'Sign out failed';
      this.errorSubject.next(errorMsg);
      this.loadingSubject.next(false);
      return { error: errorMsg };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    return this.supabaseService.getCurrentUser();
  }

  /**
   * Clear error message
   */
  clearError() {
    this.errorSubject.next(null);
  }

  /**
   * Get current user value (synchronous, may be null)
   */
  getCurrentUserValue() {
    return this.currentUserSubject.value;
  }

  /**
   * Get current authenticated state value
   */
  isAuthenticatedValue() {
    return this.isAuthenticatedSubject.value;
  }
}
