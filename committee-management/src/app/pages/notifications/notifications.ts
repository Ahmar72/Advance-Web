import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommitteeMemberRecord, CommitteeService, NotificationRecord } from '../../services/committee.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationRecord[] = [];
  pendingInvites: CommitteeMemberRecord[] = [];
  currentUserId: string | null = null;
  currentUserEmail: string | null = null;
  isLoading = true;
  error: string | null = null;

  private authSub?: Subscription;
  private realtimeSub?: any;

  constructor(
    private authService: AuthService,
    private committeeService: CommitteeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUserId = user?.id || null;
      this.currentUserEmail = user?.email || null;
      if (this.currentUserId) {
        this.loadNotifications();
        this.bindRealtime();
      }
    });
  }

  ngOnDestroy() {
    this.authSub?.unsubscribe();
    if (this.realtimeSub) {
      this.committeeService.removeRealtimeSubscription(this.realtimeSub);
    }
  }

  async loadNotifications() {
    if (!this.currentUserId) {
      return;
    }

    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await this.committeeService.listNotifications(this.currentUserId);

      if (error) {
        this.error = error.message;
        this.notifications = [];
        this.pendingInvites = [];
        return;
      }

      this.notifications = data;
      await this.loadPendingInvites();
      try { this.cdr.detectChanges(); } catch {}
    } finally {
      this.isLoading = false;
    }
  }

  async loadPendingInvites() {
    if (!this.currentUserEmail) {
      this.pendingInvites = [];
      return;
    }

    const { data, error } = await this.committeeService.listPendingInvitesByEmail(this.currentUserEmail);
    if (error) {
      console.error('Failed to load pending invites', error);
      this.pendingInvites = [];
      return;
    }

    this.pendingInvites = (data || []).filter((invite) => (invite.other_payment_details as any)?.request_type === 'invite');
  }

  async markRead(notificationId: string) {
    const { error } = await this.committeeService.markNotificationRead(notificationId);
    if (!error) {
      await this.loadNotifications();
    }
  }

  async markAllRead() {
    if (!this.currentUserId) {
      return;
    }

    const { error } = await this.committeeService.markAllNotificationsRead(this.currentUserId);
    if (!error) {
      await this.loadNotifications();
    }
  }

  unreadCount() {
    return this.notifications.filter((notification) => !notification.is_read).length;
  }

  inviteCount() {
    return this.pendingInvites.length;
  }

  async acceptInvite(invite: CommitteeMemberRecord) {
    if (!this.currentUserId) return;

    const { error } = await this.committeeService.approveJoinRequest(
      invite.committee_id,
      invite.id,
      invite.full_name,
      this.currentUserId
    );

    if (!error) {
      await this.loadNotifications();
    }
  }

  async rejectInvite(invite: CommitteeMemberRecord) {
    const { error } = await this.committeeService.rejectJoinRequest(
      invite.committee_id,
      invite.id,
      invite.full_name,
      this.currentUserId || undefined
    );

    if (!error) {
      await this.loadNotifications();
    }
  }

  formatTimestamp(value: string) {
    return new Date(value).toLocaleString();
  }

  private bindRealtime() {
    if (!this.currentUserId) {
      return;
    }

    this.realtimeSub = this.committeeService.watchNotifications(this.currentUserId, () => {
      this.loadNotifications();
    });
  }
}
