import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommitteeService } from '../../services/committee.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  myCommittees: any[] = [];
  isLoading = true;

  private authSub?: Subscription;

  constructor(
    private authService: AuthService,
    private committeeService: CommitteeService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.currentUser = user;
        this.isLoading = false;
        this.loadMyCommittees(user.id);
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
  }

  async loadMyCommittees(userId: string) {
    const { data, error } = await this.committeeService.listMyCommittees(userId);
    if (!error && data) {
      this.myCommittees = data;
    }
  }

  get userLabel() {
    return this.currentUser?.user_metadata?.display_name || this.currentUser?.email || 'User';
  }

  get administeredGroups() {
    return this.myCommittees.filter((c) => c.role === 'creator').length;
  }

  get totalCommittees() {
    return this.myCommittees.length;
  }
}
