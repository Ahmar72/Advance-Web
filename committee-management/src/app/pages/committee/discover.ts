import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommitteeService, CommitteeSummary } from '../../services/committee.service';

@Component({
  selector: 'app-committee-discover',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './discover.html',
  styleUrls: ['./discover.scss'],
})
export class CommitteeDiscoverComponent implements OnInit {
  committees: CommitteeSummary[] = [];
  isLoading = true;
  error: string | null = null;
  currentUserId: string | null = null;

  private routerSub: Subscription | null = null;
  private authSub: Subscription | null = null;
  private createdSub: Subscription | null = null;
  private updatedSub: Subscription | null = null;

  constructor(
    private committeeService: CommitteeService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUserId = user?.id || null;
    });

    this.loadCommittees();

    // Refresh list whenever the user navigates to this route
    this.routerSub = this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {
        console.debug('NavigationEnd detected, reloading committees');
        this.loadCommittees();
      }
    });

    // Listen for newly created committees and add them to the list immediately
    this.createdSub = this.committeeService.createdCommittee$.subscribe((c: any) => {
      try {
        // normalize created record into CommitteeSummary-ish shape when possible
        const item: CommitteeSummary = {
          id: c.id,
          title: c.title,
          description: c.description || null,
          monthly_amount: Number(c.monthly_amount) || 0,
          max_members: c.max_members || 0,
          duration_months: c.duration_months || 0,
          status: c.status || 'open',
          creator_name: (c.creator_id as any) || '',
          reputation_score: 0,
          current_members: 1,
          created_at: c.created_at || new Date().toISOString(),
        };

        // prepend so newest appears first
        this.committees = [item, ...this.committees];
        try { this.cdr.markForCheck(); } catch {}
      } catch (e) {
        console.warn('Failed to add created committee to discover list', e);
      }
    });

    // Listen for updates related to committees (members/cycles/payments)
    this.updatedSub = this.committeeService.committeeUpdated$.subscribe((committeeId: string) => {
      console.debug('Committee updated:', committeeId, ' — reloading discover list');
      this.loadCommittees().then(() => { try { this.cdr.detectChanges(); } catch {} });
    });
  }

  ngOnDestroy() {
    try {
      this.routerSub?.unsubscribe();
      this.authSub?.unsubscribe();
      this.createdSub?.unsubscribe();
      this.updatedSub?.unsubscribe();
    } catch (e) {
      // ignore
    }
  }

  async loadCommittees() {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await this.committeeService.listDiscoverableCommittees();
      console.debug('listDiscoverableCommittees result:', { data, error });

      if (error) {
        console.error('Failed to load committees:', error);
        this.error = error?.message || 'Failed to load committees';
        this.committees = [];
      } else {
        this.committees = data || [];
      }
    } catch (err: any) {
      console.error('Unexpected error loading committees', err);
      this.error = err?.message || 'Failed to load committees';
      this.committees = [];
    } finally {
      this.isLoading = false;
      try { this.cdr.detectChanges(); } catch {}
    }
  }

  async requestJoin(committeeId: string) {
    if (!this.currentUserId) {
      this.error = 'You must be signed in to request membership.';
      return;
    }

    const { error } = await this.committeeService.requestJoinCommittee(committeeId, this.currentUserId);
    if (error) {
      this.error = error.message || 'Unable to submit join request';
      return;
    }

    await this.loadCommittees();
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
