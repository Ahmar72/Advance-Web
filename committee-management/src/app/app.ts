import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  standalone: true,
})
export class App implements OnInit, OnDestroy {
  showShell = true;
  currentUser: any = null;

  navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/discover', label: 'Discover' },
    { path: '/my-committees', label: 'My Committees' },
    { path: '/committee/create', label: 'Create Committee' },
    { path: '/notifications', label: 'Notifications' },
  ];

  private routerSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.syncShellMode(this.router.url);

    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.syncShellMode(event.urlAfterRedirects || event.url);
      }
    });

    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  async logout() {
    const { error } = await this.authService.signOut();
    if (!error) {
      this.router.navigate(['/login']);
    }
  }

  get userLabel() {
    return this.currentUser?.user_metadata?.display_name || this.currentUser?.email || 'Signed in user';
  }

  private syncShellMode(url: string) {
    const isAuthRoute = url.startsWith('/login') || url.startsWith('/signup');
    this.showShell = !isAuthRoute;
  }
}

