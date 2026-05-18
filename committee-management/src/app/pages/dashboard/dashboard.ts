import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommitteeService, MyCommitteeSummary } from '../../services/committee.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  isLoading = true;
  myCommittees: MyCommitteeSummary[] = [];
  myCommitteesLoading = false;
  private committeeCreatedSub?: Subscription;
  private authUserSub?: Subscription;
  private authStateSub?: Subscription;
  private committeeUpdatedSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private committeeService: CommitteeService,
    private cdr: ChangeDetectorRef
  ) {}
  

  ngOnInit() {
    this.authUserSub = this.authService.currentUser$.subscribe((user) => {
      if (user === null && this.authService.isAuthenticatedValue()) {
        // Still initializing or mismatch, wait
        return;
      }
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.currentUser = user;
        this.isLoading = false;
        this.loadMyCommittees(user.id);
        this.watchCreatedCommittees(user.id);
        this.cdr.detectChanges();
      }
    });
    this.authStateSub = this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        this.router.navigate(['/login']);
      }
    });

    // Listen for committee updates (members/cycles/payments) and refresh list
    this.committeeUpdatedSub = this.committeeService.committeeUpdated$.subscribe((committeeId: string) => {
      if (!this.currentUser) return;
      console.debug('Dashboard detected committee update:', committeeId, ' — reloading my committees');
      this.loadMyCommittees(this.currentUser.id).then(() => { try { this.cdr.detectChanges(); } catch {} });
    });
  }

  async logout() {
    const { error } = await this.authService.signOut();
    if (!error) {
      this.router.navigate(['/login']);
    }
  }

  get currentUserLabel() {
    return this.currentUser?.user_metadata?.display_name || this.currentUser?.email || 'Member';
  }

  get totalCommittees() {
    return this.myCommittees.length;
  }

  get activeCommittees() {
    return this.myCommittees.filter((committee) => ['open', 'active'].includes(String(committee.status))).length;
  }

  get creatorCommittees() {
    return this.myCommittees.filter((committee) => committee.role === 'creator').length;
  }

  get totalMonthlyCommitment() {
    return this.myCommittees.reduce((total, committee) => total + Number(committee.monthly_amount || 0), 0);
  }

  get chartData() {
    const sorted = [...this.myCommittees].sort((a, b) => Number(b.monthly_amount || 0) - Number(a.monthly_amount || 0));
    const topCommittees = sorted.slice(0, 6);
    const maxValue = Math.max(...topCommittees.map((committee) => Number(committee.monthly_amount || 0)), 1);

    return topCommittees.map((committee) => ({
      id: committee.id,
      title: committee.title,
      value: Number(committee.monthly_amount || 0),
      percent: Math.max(8, Math.round((Number(committee.monthly_amount || 0) / maxValue) * 100)),
    }));
  }

  get activityItems() {
    return [...this.myCommittees]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((committee) => ({
        id: committee.id,
        title: committee.title,
        detail: committee.role === 'creator' ? 'Created by you' : 'Joined by you',
        meta: `${committee.current_members} members • ${committee.duration_months} months`,
        time: new Date(committee.created_at).toLocaleDateString(),
      }));
  }

  async loadMyCommittees(userId: string) {
    this.myCommitteesLoading = true;
    const { data, error } = await this.committeeService.listMyCommittees(userId);
    this.myCommitteesLoading = false;

    if (error) {
      console.error('Failed to load my committees:', error);
      this.myCommittees = [];
      return;
    }

    this.myCommittees = data || [];
    this.cdr.detectChanges();
  }

  watchCreatedCommittees(userId: string) {
    this.committeeCreatedSub?.unsubscribe();
    this.committeeCreatedSub = this.committeeService.createdCommittee$.subscribe((committee: any) => {
      if (committee?.creator_id !== userId) {
        return;
      }

      const item: MyCommitteeSummary = {
        id: committee.id,
        title: committee.title,
        description: committee.description || null,
        monthly_amount: Number(committee.monthly_amount) || 0,
        max_members: Number(committee.max_members) || 0,
        duration_months: Number(committee.duration_months) || 0,
        status: committee.status || 'open',
        creator_name: this.currentUser?.user_metadata?.display_name || this.currentUser?.email || 'You',
        reputation_score: 0,
        current_members: 1,
        created_at: committee.created_at || new Date().toISOString(),
        creator_id: committee.creator_id,
        role: 'creator',
      };

      this.myCommittees = [item, ...this.myCommittees.filter((c) => c.id !== item.id)];
    });
  }

  ngOnDestroy() {
    this.committeeCreatedSub?.unsubscribe();
    this.committeeUpdatedSub?.unsubscribe();
    this.authUserSub?.unsubscribe();
    this.authStateSub?.unsubscribe();
  }
}
