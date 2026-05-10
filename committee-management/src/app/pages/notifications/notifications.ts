import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { CommitteeService, NotificationRecord } from '../../services/committee.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.scss'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: NotificationRecord[] = [];
  currentUserId: string | null = null;
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
    const { data, error } = await this.committeeService.listNotifications(this.currentUserId);
    this.isLoading = false;

    if (error) {
      this.error = error.message;
      this.notifications = [];
      return;
    }

    this.notifications = data;
    try { this.cdr.detectChanges(); } catch {}
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
