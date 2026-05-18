import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  CommitteeCycleRecord,
  CommitteeDetail,
  CommitteeMemberRecord,
  CommitteeRecord,
  CommitteeService,
  PaymentRecord,
} from '../../services/committee.service';

@Component({
  selector: 'app-committee-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './detail.html',
  styleUrls: ['./detail.scss'],
})
export class CommitteeDetailComponent implements OnInit, OnDestroy {
  committee: CommitteeDetail | null = null;
  isLoading = true;
  error: string | null = null;
  currentUserId: string | null = null;
  isCreator = false;
  isDeleting = false;

  memberForm = {
    full_name: '',
    email_or_phone: '',
    payment_identifier: '',
    iban: '',
    bank_account_id: '',
    other_payment_details: '',
  };

  cycleForm = {
    cycle_number: 1,
    scheduled_date: '',
    recipient_member_id: '',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
  };

  paymentForm = {
    cycle_id: '',
    payer_member_id: '',
    amount: 0,
    payment_status: 'pending' as 'pending' | 'paid' | 'failed' | 'late',
    reference: '',
    proof_url: '',
    paid_at: '',
  };

  private loadTimeoutHandle?: any;
  private routeSub?: Subscription;
  private authSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private committeeService: CommitteeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUserId = user?.id || null;
      this.refreshCreatorFlag();
      this.cdr.markForCheck();
    });

    this.routeSub = this.route.paramMap.subscribe((params) => {
      const committeeId = params.get('id');
      if (committeeId) {
        this.loadCommittee(committeeId);
      }
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.authSub?.unsubscribe();
  }

  async loadCommittee(id: string) {
    this.isLoading = true;
    this.error = null;
    try {
      console.log('🔄 [Detail] Loading committee detail for id:', id);

      const { data, error } = await this.committeeService.getCommitteeDetail(id);
      
      if (error) {
        console.error('❌ [Detail] getCommitteeDetail failed:', error);
        this.error = error.message || 'Failed to load committee';
        return;
      }

      if (!data) {
        this.error = 'Committee not found.';
        return;
      }

      this.committee = data;

      this.cycleForm = {
        cycle_number: data.cycles.length + 1,
        scheduled_date: '',
        recipient_member_id: data.nextRecipient?.id || data.members[0]?.id || '',
        status: 'pending',
      };

      this.paymentForm = {
        cycle_id: data.cycles[0]?.id || '',
        payer_member_id: data.members.find((member) => member.user_id === this.currentUserId)?.id || data.members[0]?.id || '',
        amount: Number(data.monthly_amount),
        payment_status: 'pending',
        reference: '',
        proof_url: '',
        paid_at: '',
      };

      this.refreshCreatorFlag();
      console.log('✅ [Detail] Committee detail loaded successfully');
      this.cdr.markForCheck();
    } catch (err: any) {
      console.error('❌ [Detail] Unexpected error:', err);
      this.error = err?.message || 'Failed to load committee details';
      this.cdr.markForCheck();
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async addMember() {
    if (!this.committee || !this.isCreator) {
      return;
    }

    const nextJoinOrder = this.committee.members.length + 1;
    if (nextJoinOrder > this.committee.max_members) {
      this.error = 'This committee has reached the maximum number of members.';
      return;
    }

    let parsedDetails: Record<string, any> = {};

    if (this.memberForm.other_payment_details.trim()) {
      try {
        parsedDetails = JSON.parse(this.memberForm.other_payment_details);
      } catch {
        this.error = 'Other payment details must be valid JSON.';
        return;
      }
    }

    const { data, error } = await this.committeeService.addMember({
      committee_id: this.committee.id,
      full_name: this.memberForm.full_name.trim(),
      email_or_phone: this.memberForm.email_or_phone.trim() || undefined,
      join_order: nextJoinOrder,
      payment_identifier: this.memberForm.payment_identifier.trim() || undefined,
      iban: this.memberForm.iban.trim() || undefined,
      bank_account_id: this.memberForm.bank_account_id.trim() || undefined,
      other_payment_details: {
        ...parsedDetails,
        request_type: 'invite',
        committee_title: this.committee.title,
      },
    });

    if (error || !data) {
      this.error = error?.message || 'Failed to add member';
      return;
    }

    this.memberForm = {
      full_name: '',
      email_or_phone: '',
      payment_identifier: '',
      iban: '',
      bank_account_id: '',
      other_payment_details: '',
    };

    await this.loadCommittee(this.committee.id);
  }

  async approveRequest(member: CommitteeMemberRecord) {
    if (!this.committee) return;

    const requesterUserId = (member.other_payment_details as any)?.requester_id || member.user_id || undefined;

    const { error } = await this.committeeService.approveJoinRequest(
      this.committee.id,
      member.id,
      member.full_name,
      requesterUserId
    );

    if (error) {
      this.error = (error as any)?.message || 'Failed to approve request';
      return;
    }

    await this.loadCommittee(this.committee.id);
  }

  async rejectRequest(member: CommitteeMemberRecord) {
    if (!this.committee) return;

    const { error } = await this.committeeService.rejectJoinRequest(
      this.committee.id,
      member.id,
      member.full_name,
      (member.other_payment_details as any)?.requester_id || member.user_id || undefined
    );

    if (error) {
      this.error = error.message || 'Failed to reject request';
      return;
    }

    await this.loadCommittee(this.committee.id);
  }

  async deleteCommittee() {
    if (!this.committee) {
      console.warn('⚠️ [Detail] Delete attempted but no committee loaded');
      return;
    }
    
    console.log('🔄 [Detail] Delete requested. isCreator:', this.isCreator, 'canManage:', this.canManageCommittee);
    console.log('📊 [Detail] CreatorID:', this.committee.creator_id, 'CurrentUserID:', this.currentUserId);

    if (!this.canManageCommittee) {
      this.error = 'You do not have permission to delete this committee.';
      return;
    }

    const confirmed = window.confirm(`Delete ${this.committee.title}? This cannot be undone.`);
    if (!confirmed) return;

    this.isDeleting = true;
    try {
      const { error } = await this.committeeService.deleteCommittee(this.committee.id);
      if (error) {
        this.error = error.message || 'Failed to delete committee';
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } finally {
      this.isDeleting = false;
      this.cdr.markForCheck();
    }
  }

  async addCycle() {
    if (!this.committee || !this.isCreator) {
      return;
    }

    if (!this.cycleForm.recipient_member_id || !this.cycleForm.scheduled_date) {
      this.error = 'Choose a recipient and scheduled date for the cycle.';
      return;
    }

    const { data, error } = await this.committeeService.createCommitteeCycle({
      committee_id: this.committee.id,
      cycle_number: Number(this.cycleForm.cycle_number),
      scheduled_date: this.cycleForm.scheduled_date,
      recipient_member_id: this.cycleForm.recipient_member_id,
      status: this.cycleForm.status,
    });

    if (error || !data) {
      this.error = error?.message || 'Failed to create cycle';
      return;
    }

    this.cycleForm = {
      cycle_number: this.committee.cycles.length + 1,
      scheduled_date: '',
      recipient_member_id: '',
      status: 'pending',
    };

    await this.loadCommittee(this.committee.id);
  }

  async addPayment() {
    if (!this.committee) {
      return;
    }

    if (!this.paymentForm.cycle_id || !this.paymentForm.payer_member_id || !this.paymentForm.amount) {
      this.error = 'Select a cycle, payer, and amount for the payment.';
      return;
    }

    const { data, error } = await this.committeeService.createPayment({
      committee_id: this.committee.id,
      cycle_id: this.paymentForm.cycle_id,
      payer_member_id: this.paymentForm.payer_member_id,
      amount: Number(this.paymentForm.amount),
      payment_status: this.paymentForm.payment_status,
      reference: this.paymentForm.reference.trim() || undefined,
      proof_url: this.paymentForm.proof_url.trim() || undefined,
      paid_at: this.paymentForm.paid_at || undefined,
    });

    if (error || !data) {
      this.error = error?.message || 'Failed to create payment';
      return;
    }

    this.paymentForm = {
      cycle_id: '',
      payer_member_id: '',
      amount: this.committee.monthly_amount,
      payment_status: 'pending',
      reference: '',
      proof_url: '',
      paid_at: '',
    };

    await this.loadCommittee(this.committee.id);
  }

  formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private refreshCreatorFlag() {
    this.isCreator = !!this.committee && !!this.currentUserId && this.committee.creator_id === this.currentUserId;
  }

  get canManageCommittee() {
    return !!this.committee && !!this.currentUserId && this.committee.creator_id === this.currentUserId;
  }

  private resolveNextRecipient(members: CommitteeMemberRecord[], cycles: CommitteeCycleRecord[]) {
    const nextCycle = cycles.find((cycle) => cycle.status !== 'completed');
    if (!nextCycle) {
      return null;
    }

    return members.find((member) => member.id === nextCycle.recipient_member_id) || null;
  }
}

