import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommitteeService, MyCommitteeSummary } from '../../services/committee.service';

@Component({
  selector: 'app-my-committees',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-committees.html',
  styleUrls: ['./my-committees.scss'],
})
export class MyCommitteesComponent implements OnInit {
  currentUserId: string | null = null;
  committees: MyCommitteeSummary[] = [];
  isLoading = true;
  error: string | null = null;
  private authSub: Subscription | null = null;
  private updatedSub: Subscription | null = null;

  constructor(private authService: AuthService, private committeeService: CommitteeService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUserId = user?.id || null;
      if (this.currentUserId) {
        this.loadCommittees();
      }
    });

    this.updatedSub = this.committeeService.committeeUpdated$.subscribe(() => {
      if (this.currentUserId) {
        this.loadCommittees();
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    this.updatedSub?.unsubscribe();
  }

  async loadCommittees() {
    if (!this.currentUserId) return;

    this.isLoading = true;
    this.error = null;
    const { data, error } = await this.committeeService.listMyCommittees(this.currentUserId);
    this.isLoading = false;

    if (error) {
      this.error = error.message || 'Failed to load committees';
      this.committees = [];
      return;
    }

    this.committees = data || [];
    try { this.cdr.detectChanges(); } catch {}
  }

  async deleteCommittee(committee: MyCommitteeSummary) {
    if (committee.role !== 'creator') return;
    const confirmed = window.confirm(`Delete ${committee.title}? This cannot be undone.`);
    if (!confirmed) return;

    const { error } = await this.committeeService.deleteCommittee(committee.id);
    if (error) {
      this.error = error.message || 'Failed to delete committee';
      return;
    }

    await this.loadCommittees();
  }
}