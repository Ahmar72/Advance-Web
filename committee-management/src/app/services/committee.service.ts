import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SupabaseService } from './supabase.service';

export interface CommitteeSummary {
  id: string;
  title: string;
  description: string | null;
  monthly_amount: number;
  max_members: number;
  duration_months: number;
  status: string;
  creator_name: string;
  reputation_score: number;
  current_members: number;
  created_at: string;
  progress_percentage?: number;
  total_cycles?: number;
  completed_cycles?: number;
}

export interface MyCommitteeSummary extends CommitteeSummary {
  role: 'creator' | 'member';
}

export interface CommitteeRecord {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  duration_months: number;
  monthly_amount: number;
  max_members: number;
  status: string;
  start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommitteeMemberRecord {
  id: string;
  committee_id: string;
  user_id: string | null;
  full_name: string;
  email_or_phone: string | null;
  join_order: number;
  is_creator: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  payment_identifier: string | null;
  iban: string | null;
  bank_account_id: string | null;
  other_payment_details: Record<string, any> | null;
  joined_at: string;
  updated_at: string;
}

export interface CommitteeCycleRecord {
  id: string;
  committee_id: string;
  cycle_number: number;
  scheduled_date: string;
  recipient_member_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  committee_id: string;
  cycle_id: string;
  payer_member_id: string;
  amount: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'late';
  reference: string | null;
  proof_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: 'new_committee' | 'upcoming_turn' | 'payment_update' | 'committee_message' | 'join_request' | 'join_request_response';
  title: string;
  body: string | null;
  data: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface CommitteeDetail extends CommitteeRecord {
  creator_profile?: {
    display_name: string;
    reputation_score: number;
    experience_score: number;
    bio: string | null;
    avatar_url: string | null;
  } | null;
  members: CommitteeMemberRecord[];
  pendingMembers?: CommitteeMemberRecord[];
  pendingInvites?: CommitteeMemberRecord[];
  cycles: CommitteeCycleRecord[];
  payments: PaymentRecord[];
  currentMembers: number;
  completedCycles: number;
  progressPercentage: number;
  nextRecipient: CommitteeMemberRecord | null;
}

export interface CreateCommitteePayload {
  title: string;
  description?: string;
  duration_months: number;
  monthly_amount: number;
  max_members: number;
}

export interface AddCommitteeMemberPayload {
  committee_id: string;
  full_name: string;
  email_or_phone?: string;
  join_order: number;
  payment_identifier?: string;
  iban?: string;
  bank_account_id?: string;
  other_payment_details?: Record<string, any>;
}

export interface CreateCommitteeCyclePayload {
  committee_id: string;
  cycle_number: number;
  scheduled_date: string;
  recipient_member_id: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface CreatePaymentPayload {
  committee_id: string;
  cycle_id: string;
  payer_member_id: string;
  amount: number;
  payment_status?: 'pending' | 'paid' | 'failed' | 'late';
  reference?: string;
  proof_url?: string;
  paid_at?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CommitteeService {
  // Emits when a committee is created so UI can update in realtime
  public createdCommittee$ = new Subject<CommitteeRecord>();
  public committeeUpdated$ = new Subject<string>();

  private committeesChannel: any = null;
  private approvalStatusSupported: boolean | null = null;

  private isApprovalStatusMissingError(error: any) {
    const message = String(error?.message || '').toLowerCase();
    const statusCode = error?.status || error?.statusCode || 0;
    // Check for explicit schema cache message OR 400 error with approval_status in message
    return (
      (message.includes('approval_status') && message.includes('schema cache')) ||
      (statusCode === 400 && message.includes('approval_status'))
    );
  }

  constructor(private supabaseService: SupabaseService) {
    try {
      this.startCommitteesRealtime();
    } catch (e) {
      console.warn('Failed to start committees realtime listener', e);
    }
  }

  private startCommitteesRealtime() {
    const client = this.supabaseService.getClient();
    try {
      this.committeesChannel = client
        .channel('public:committees')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'committees' }, (payload: any) => {
          try {
            const newRow = payload?.new;
            if (newRow) {
              console.debug('Realtime: new committee detected', newRow);
              this.createdCommittee$.next(newRow as CommitteeRecord);
            }
          } catch (e) {
            console.warn('Error handling realtime committees payload', e);
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('Could not subscribe to committees realtime channel', err);
    }
  }

  async createCommittee(payload: CreateCommitteePayload, creatorId: string) {
    try {
      console.log('Starting committee creation with payload:', payload, 'creatorId:', creatorId);
      
      // Step 1: Ensure the creator's profile exists
      console.log('Step 1: Checking if profile exists for user:', creatorId);
      const { data: profileExists, error: profileError } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('id')
        .eq('id', creatorId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileError);
      }

      if (!profileExists) {
        console.log('Profile does not exist, creating one...');
        const { error: createProfileError } = await this.supabaseService
          .getClient()
          .from('profiles')
          .insert({
            id: creatorId,
            display_name: 'User',
            experience_score: 0,
            reputation_score: 0,
          });

        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
          throw createProfileError;
        }
        console.log('Profile created successfully');
      } else {
        console.log('Profile already exists');
      }

      // Step 2: Create the committee
      console.log('Step 2: Creating committee...');
      const { data, error } = await this.supabaseService
        .getClient()
        .from('committees')
        .insert({
          creator_id: creatorId,
          title: payload.title,
          description: payload.description || null,
          duration_months: payload.duration_months,
          monthly_amount: payload.monthly_amount,
          max_members: payload.max_members,
          status: 'open',
        })
        .select()
        .single();

      console.log('Committee creation result:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
      }

      // broadcast newly created committee for UI to pick up immediately
      if (data && !error) {
        try {
          this.createdCommittee$.next(data as CommitteeRecord);
        } catch (e) {
          console.warn('Failed to emit created committee:', e);
        }
        try {
          const refreshed = await this.listDiscoverableCommittees();
          console.debug('Refreshed discoverable committees after create', refreshed);
        } catch (e) {
          console.warn('Failed to refresh discoverable committees after create', e);
        }
      }

      return { data: data as CommitteeRecord | null, error };
    } catch (err) {
      console.error('Unexpected error in createCommittee:', err);
      throw err;
    }
  }

  private async supportsApprovalStatus() {
    // Always return false - we don't support approval_status column
    // This simplifies queries and avoids schema cache errors
    this.approvalStatusSupported = false;
    return false;
  }

  async listDiscoverableCommittees() {
    try {
      return await this.listDiscoverableCommitteesFallback();
    } catch (err) {
      console.error('Exception while fetching discoverable committees', err);
      return await this.listDiscoverableCommitteesFallback(err as any);
    }
  }

  private async listDiscoverableCommitteesFallback(fallbackError: any = null) {
    try {
      const client = this.supabaseService.getClient();

      const { data: committees, error: committeeError } = await client
        .from('committees')
        .select('id,title,description,monthly_amount,max_members,duration_months,status,created_at,creator_id')
        .in('status', ['open', 'active'])
        .order('created_at', { ascending: false });

      if (committeeError) {
        console.error('Fallback discover query failed:', committeeError);
        return { data: [] as CommitteeSummary[], error: fallbackError || committeeError };
      }

      const committeeRows = committees || [];
      const committeeIds = committeeRows.map((row: any) => row.id).filter(Boolean);
      const creatorIds = Array.from(new Set(committeeRows.map((row: any) => row.creator_id).filter(Boolean)));
      const memberCounts = new Map<string, number>();
      const progressMap = new Map<string, any>();
      const profileMap = new Map<string, any>();

      if (creatorIds.length) {
        const { data: profiles, error: profileError } = await client
          .from('profiles')
          .select('id,display_name,reputation_score')
          .in('id', creatorIds);

        if (profileError) {
          console.error('Fallback discover profile lookup error:', profileError);
        } else {
          (profiles || []).forEach((profile: any) => {
            profileMap.set(profile.id, profile);
          });
        }
      }

      if (committeeIds.length) {
        const { data: memberRows, error: memberError } = await client
          .from('committee_members')
          .select('committee_id')
          .in('committee_id', committeeIds)
          .not('user_id', 'is', null);

        if (memberError) {
          console.error('Fallback discover member count error:', memberError);
        } else {
          (memberRows || []).forEach((row: any) => {
            const current = memberCounts.get(row.committee_id) || 0;
            memberCounts.set(row.committee_id, current + 1);
          });
        }

        const { data: progressRows, error: progressError } = await client
          .from('committee_progress')
          .select('id, progress_percentage, total_cycles, completed_cycles')
          .in('id', committeeIds);

        if (progressError) {
          console.error('Fallback discover progress error:', progressError);
        } else {
          (progressRows || []).forEach((row: any) => {
            progressMap.set(row.id, row);
          });
        }
      }

      const mapped = committeeRows.map((row: any) => {
        const progress = progressMap.get(row.id) || {};
        const profile = profileMap.get(row.creator_id) || {};

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          monthly_amount: Number(row.monthly_amount),
          max_members: Number(row.max_members),
          duration_months: Number(row.duration_months),
          status: row.status,
          creator_name: profile.display_name || 'Unknown',
          reputation_score: Number(profile.reputation_score || 0),
          current_members: Number(memberCounts.get(row.id) || 0),
          created_at: row.created_at,
          progress_percentage: progress.progress_percentage !== undefined ? Number(progress.progress_percentage || 0) : undefined,
          total_cycles: progress.total_cycles !== undefined ? Number(progress.total_cycles || 0) : undefined,
          completed_cycles: progress.completed_cycles !== undefined ? Number(progress.completed_cycles || 0) : undefined,
        } as CommitteeSummary;
      });

      console.debug('Fallback discover committees result:', { data: mapped, error: null });
      return { data: mapped, error: null };
    } catch (err) {
      console.error('Exception in fallback discover query', err);
      return { data: [] as CommitteeSummary[], error: fallbackError || (err as any) };
    }
  }

  async getCommitteeById(id: string) {
    try {
      console.log('🔄 [Service] Querying committee by id:', id);
      const { data, error } = await this.supabaseService
        .getClient()
        .from('committees')
        .select('id,title,description,creator_id,monthly_amount,max_members,duration_months,status,created_at,updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ [Service] getCommitteeById error:', error);
      } else {
        console.log('✅ [Service] getCommitteeById found:', data?.title);
      }
      return { data: data as CommitteeRecord | null, error };
    } catch (err) {
      console.error('❌ [Service] Exception in getCommitteeById:', err);
      return { data: null, error: err as any };
    }
  }

  async getCreatorProfile(creatorId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('display_name, reputation_score, experience_score, bio, avatar_url')
        .eq('id', creatorId)
        .single();

      if (error) console.error('getCreatorProfile error:', error);
      return { data, error };
    } catch (err) {
      console.error('Unexpected error in getCreatorProfile:', err);
      return { data: null, error: err as any };
    }
  }

  async getCommitteeMembers(committeeId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('committee_members')
        .select('id,committee_id,user_id,full_name,email_or_phone,join_order,is_creator')
        .eq('committee_id', committeeId)
        .order('join_order', { ascending: true });

      if (error) console.error('getCommitteeMembers error:', error);
      return { data: (data || []) as any[], error };
    } catch (err) {
      console.error('Unexpected error in getCommitteeMembers:', err);
      return { data: [], error: err as any };
    }
  }

  async listPendingInvitesByEmail(email: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('committee_members')
        .select('id,committee_id,user_id,full_name,email_or_phone,join_order,is_creator,other_payment_details')
        .eq('email_or_phone', email)
        .is('user_id', null)
        .order('join_order', { ascending: true });

      if (error) console.error('listPendingInvitesByEmail error:', error);
      return { data: (data || []) as CommitteeMemberRecord[], error };
    } catch (err) {
      console.error('Unexpected error in listPendingInvitesByEmail:', err);
      return { data: [], error: err as any };
    }
  }

  async requestJoinCommittee(
    committeeId: string,
    userId: string,
    requesterEmail?: string,
    retriedWithoutApproval = false
  ): Promise<{ data: CommitteeMemberRecord | null; error: any }> {
    try {
      const client = this.supabaseService.getClient();
      const [{ data: committee, error: committeeError }, { data: profile }] = await Promise.all([
        client.from('committees').select('id,title,creator_id,max_members,status').eq('id', committeeId).single(),
        client.from('profiles').select('display_name').eq('id', userId).single(),
      ]);

      if (committeeError) return { data: null, error: committeeError };

      const pendingContact = requesterEmail || null;

      // Check if user already a member or has a pending request for this committee.
      const existing = await client
        .from('committee_members')
        .select('id')
        .eq('committee_id', committeeId)
        .or(`user_id.eq.${userId}${pendingContact ? `,email_or_phone.eq.${pendingContact}` : ''}`)
        .maybeSingle();

      if (existing.error) {
        return { data: null, error: existing.error as any };
      }

      if (existing.data) {
        return { data: existing.data as any, error: new Error('You already have a membership or pending request in this committee') as any };
      }

      // Count current members (without approval_status filter)
      const approvedCount = await client
        .from('committee_members')
        .select('id', { count: 'exact', head: true })
        .eq('committee_id', committeeId);

      if (approvedCount.error) {
        return { data: null, error: approvedCount.error as any };
      }

      if ((approvedCount.count || 0) >= Number(committee?.max_members || 0)) {
        return { data: null, error: new Error('This committee is full') as any };
      }

      // Create member record without approval_status
      const memberPayload: Record<string, any> = {
        committee_id: committeeId,
        user_id: null,
        full_name: profile?.display_name || 'Member',
        email_or_phone: pendingContact,
        join_order: Number(approvedCount.count || 0) + 1,
        is_creator: false,
        other_payment_details: {
          request_type: 'join_request',
          requester_id: userId,
          requester_email: pendingContact,
          requester_name: profile?.display_name || 'Member',
        },
      };

      const { data, error } = await client
        .from('committee_members')
        .insert(memberPayload)
        .select('id,committee_id,user_id,full_name,email_or_phone,join_order,is_creator')
        .single();

      if (!error && data) {
        // Send notification to the creator; the pending row keeps the request state
        await client.from('notifications').insert({
          user_id: committee.creator_id,
          type: 'join_request',
          title: `Join request for ${committee.title}`,
          body: `${profile?.display_name || 'A user'} wants to join this committee.`,
          data: {
            committee_id: committeeId,
            requester_id: userId,
            requester_name: profile?.display_name || 'Member',
            member_id: data.id,
            request_type: 'join_request',
          },
        });
        try { this.committeeUpdated$.next(committeeId); } catch {}
      }

      return { data: data as CommitteeMemberRecord | null, error };
    } catch (err) {
      console.error('Exception in requestJoinCommittee', err);
      return { data: null, error: err as any };
    }
  }

  async approveJoinRequest(committeeId: string, memberId: string, memberName?: string, requesterUserId?: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('committee_members')
      .update({ user_id: requesterUserId || null })
      .eq('committee_id', committeeId)
      .eq('id', memberId)
      .select('id,committee_id,user_id,full_name,email_or_phone,join_order,is_creator')
      .single();

    if (!error && requesterUserId) {
      await client.from('notifications').insert({
        user_id: requesterUserId,
        type: 'join_request_response',
        title: 'Request accepted',
        body: `Your request to join ${memberName || 'the committee'} was accepted.`,
        data: { committee_id: committeeId, member_id: memberId, status: 'approved' },
      });
    }
    try { this.committeeUpdated$.next(committeeId); } catch {}

    return { data: data as CommitteeMemberRecord | null, error };
  }

  async rejectJoinRequest(committeeId: string, memberId: string, memberName?: string, requesterUserId?: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('committee_members')
      .delete()
      .eq('id', memberId)
      .select()
      .single();

    if (!error && requesterUserId) {
      await client.from('notifications').insert({
        user_id: requesterUserId,
        type: 'join_request_response',
        title: 'Join request rejected',
        body: `Your request to join ${memberName || 'the committee'} was rejected.`,
        data: { committee_id: committeeId, member_id: memberId, status: 'rejected' },
      });
    }
    try { this.committeeUpdated$.next(committeeId); } catch {}

    return { data: data as CommitteeMemberRecord | null, error };
  }

  async deleteCommittee(committeeId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('committees')
      .delete()
      .eq('id', committeeId)
      .select()
      .single();

    return { data: data as CommitteeRecord | null, error };
  }

  async getCommitteeCycles(committeeId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('committee_cycles')
        .select('*')
        .eq('committee_id', committeeId)
        .order('cycle_number', { ascending: true });

      if (error) console.error('getCommitteeCycles error:', error);
      return { data: (data || []) as CommitteeCycleRecord[], error };
    } catch (err) {
      console.error('Unexpected error in getCommitteeCycles:', err);
      return { data: [], error: err as any };
    }
  }

  async getCommitteePayments(committeeId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('payments')
        .select('*')
        .eq('committee_id', committeeId)
        .order('created_at', { ascending: false });

      if (error) console.error('getCommitteePayments error:', error);
      return { data: (data || []) as PaymentRecord[], error };
    } catch (err) {
      console.error('Unexpected error in getCommitteePayments:', err);
      return { data: [], error: err as any };
    }
  }

  async listNotifications(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data: (data || []) as NotificationRecord[], error };
  }

  async markNotificationRead(notificationId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    return { data: data as NotificationRecord | null, error };
  }

  async markAllNotificationsRead(userId: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    return { data: (data || []) as NotificationRecord[], error };
  }

  watchNotifications(userId: string, onChange: () => void) {
    return this.supabaseService
      .getClient()
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => onChange()
      )
      .subscribe();
  }

  removeRealtimeSubscription(subscription: any) {
    return this.supabaseService.getClient().removeChannel(subscription);
  }

  async getCommitteeProgress(committeeId: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('committee_progress')
        .select('*')
        .eq('id', committeeId)
        .single();

      if (error) console.error('getCommitteeProgress error:', error);
      return { data, error };
    } catch (err) {
      console.error('Unexpected error in getCommitteeProgress:', err);
      return { data: null, error: err as any };
    }
  }

  async addMember(payload: AddCommitteeMemberPayload) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('committee_members')
      .insert({
        committee_id: payload.committee_id,
        user_id: null,
        full_name: payload.full_name,
        email_or_phone: payload.email_or_phone || null,
        join_order: payload.join_order,
        is_creator: false,
        payment_identifier: payload.payment_identifier || null,
        iban: payload.iban || null,
        bank_account_id: payload.bank_account_id || null,
        other_payment_details: payload.other_payment_details || {},
      })
      .select('id,committee_id,user_id,full_name,email_or_phone,join_order,is_creator')
      .single();

    if (data && !error) {
      try { this.committeeUpdated$.next(payload.committee_id); } catch {}
    }
    return { data: data as CommitteeMemberRecord | null, error };
  }

  async createCommitteeCycle(payload: CreateCommitteeCyclePayload) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('committee_cycles')
      .insert({
        committee_id: payload.committee_id,
        cycle_number: payload.cycle_number,
        scheduled_date: payload.scheduled_date,
        recipient_member_id: payload.recipient_member_id,
        status: payload.status || 'pending',
      })
      .select()
      .single();

    if (data && !error) {
      try { this.committeeUpdated$.next(payload.committee_id); } catch {}
    }
    return { data: data as CommitteeCycleRecord | null, error };
  }

  async createPayment(payload: CreatePaymentPayload) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('payments')
      .insert({
        committee_id: payload.committee_id,
        cycle_id: payload.cycle_id,
        payer_member_id: payload.payer_member_id,
        amount: payload.amount,
        payment_status: payload.payment_status || 'pending',
        reference: payload.reference || null,
        proof_url: payload.proof_url || null,
        paid_at: payload.paid_at || null,
      })
      .select()
      .single();

    if (data && !error) {
      try { this.committeeUpdated$.next(payload.committee_id); } catch {}
    }
    return { data: data as PaymentRecord | null, error };
  }

  // Fetch committees created by or joined by the user
  async listMyCommittees(userId: string) {
    try {
      // created committees
      const { data: created, error: createdError } = await this.supabaseService
        .getClient()
        .from('committees')
        .select('id,title,description,monthly_amount,max_members,duration_months,status,created_at,creator_id,profiles(display_name,reputation_score)')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (createdError) console.error('listMyCommittees created error:', createdError);

      // joined committees via committee_members
      const { data: memberRows, error: memberError } = await this.supabaseService
        .getClient()
        .from('committee_members')
        .select('committee_id')
        .eq('user_id', userId);

      if (memberError) console.error('listMyCommittees member lookup error:', memberError);

      const joinedIds = (memberRows || []).map((r: any) => r.committee_id).filter(Boolean);
      let joined: any[] = [];
      if (joinedIds.length) {
        const { data: jdata, error: jerr } = await this.supabaseService
          .getClient()
          .from('committees')
          .select('id,title,description,monthly_amount,max_members,duration_months,status,created_at,creator_id,profiles(display_name,reputation_score)')
          .in('id', joinedIds)
          .order('created_at', { ascending: false });
        if (jerr) console.error('listMyCommittees joined fetch error:', jerr);
        joined = jdata || [];
      }

      const rows = [...(created || []), ...joined];

      const committeeIds = rows.map((row: any) => row.id).filter(Boolean);
      const [memberCountsResult, progressResult] = await Promise.all([
        committeeIds.length
          ? this.supabaseService.getClient()
              .from('committee_members')
              .select('committee_id')
              .in('committee_id', committeeIds)
          : Promise.resolve({ data: [], error: null } as any),
        committeeIds.length
          ? this.supabaseService.getClient()
              .from('committee_progress')
              .select('id, progress_percentage, total_cycles, completed_cycles')
              .in('id', committeeIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (memberCountsResult.error) {
        console.error('listMyCommittees member count error:', memberCountsResult.error);
      }
      if (progressResult.error) {
        console.error('listMyCommittees progress error:', progressResult.error);
      }

      const memberCounts = new Map<string, number>();
      (memberCountsResult.data || []).forEach((row: any) => {
        const count = memberCounts.get(row.committee_id) || 0;
        memberCounts.set(row.committee_id, count + 1);
      });

      const progressMap = new Map<string, any>();
      (progressResult.data || []).forEach((row: any) => {
        progressMap.set(row.id, row);
      });

      // dedupe by id
      const seen = new Set<string>();
      const mapped = rows.filter((r: any) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      }).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        monthly_amount: Number(row.monthly_amount),
        max_members: Number(row.max_members),
        duration_months: Number(row.duration_months),
        status: row.status,
        creator_name: row.profiles?.display_name || 'Unknown',
        reputation_score: Number(row.profiles?.reputation_score || 0),
        current_members: Number(memberCounts.get(row.id) || 0) || Number(row.current_members || 0) || 0,
        created_at: row.created_at,
        progress_percentage: Number(progressMap.get(row.id)?.progress_percentage || 0),
        total_cycles: Number(progressMap.get(row.id)?.total_cycles || 0),
        completed_cycles: Number(progressMap.get(row.id)?.completed_cycles || 0),
        role: row.creator_id === userId ? 'creator' : 'member',
      })) as MyCommitteeSummary[];

      return { data: mapped, error: null };
    } catch (err) {
      console.error('Exception in listMyCommittees', err);
      return { data: [] as MyCommitteeSummary[], error: err as any };
    }
  }
}
