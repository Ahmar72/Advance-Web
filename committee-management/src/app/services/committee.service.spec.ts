import { TestBed } from '@angular/core/testing';
import { CommitteeService } from './committee.service';
import { SupabaseService } from './supabase.service';

describe('CommitteeService', () => {
  let service: CommitteeService;
  let supabaseServiceStub: any;

  beforeEach(() => {
    supabaseServiceStub = {
      getClient: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CommitteeService,
        { provide: SupabaseService, useValue: supabaseServiceStub },
      ],
    });

    service = TestBed.inject(CommitteeService);
  });

  it('maps create committee payload to the committees table', async () => {
    const single = vi.fn().mockResolvedValue({
      data: { id: 'committee-1', title: 'Rotating Savings' },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));
    supabaseServiceStub.getClient.mockReturnValue({ from });

    const result = await service.createCommittee(
      {
        title: 'Rotating Savings',
        description: '10 month committee',
        duration_months: 10,
        monthly_amount: 250,
        max_members: 10,
      },
      'user-1'
    );

    expect(from).toHaveBeenCalledWith('committees');
    expect(insert).toHaveBeenCalledWith({
      creator_id: 'user-1',
      title: 'Rotating Savings',
      description: '10 month committee',
      duration_months: 10,
      monthly_amount: 250,
      max_members: 10,
      status: 'open',
    });
    expect(result.data?.id).toBe('committee-1');
  });

  it('loads discoverable committees from the active view', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'committee-1',
          title: 'Savings Circle',
          description: null,
          monthly_amount: 100,
          max_members: 10,
          duration_months: 10,
          status: 'open',
          creator_name: 'Amina',
          reputation_score: 8,
          current_members: 1,
          created_at: new Date().toISOString(),
        },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    supabaseServiceStub.getClient.mockReturnValue({ from });

    const result = await service.listDiscoverableCommittees();

    expect(from).toHaveBeenCalledWith('active_committees_with_creator');
    expect(select).toHaveBeenCalledWith('*');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].creator_name).toBe('Amina');
  });

  it('falls back to direct committee queries when the active view fails', async () => {
    const viewOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Could not find the approval_status column of committee_members in the schema cache' },
    });
    const viewSelect = vi.fn(() => ({ order: viewOrder }));

    const fallbackOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'committee-2',
          title: 'Harvest Circle',
          description: 'Seasonal savings group',
          monthly_amount: 50,
          max_members: 8,
          duration_months: 8,
          status: 'open',
          created_at: new Date().toISOString(),
          creator_id: 'user-2',
          profiles: { display_name: 'Mina', reputation_score: 12 },
        },
      ],
      error: null,
    });
    const fallbackSelect = vi.fn(() => ({
      in: vi.fn(() => ({ order: fallbackOrder })),
    }));
    const memberSelect = vi.fn(() => ({
      in: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [{ committee_id: 'committee-2' }], error: null }) })),
    }));
    const progressSelect = vi.fn(() => ({
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }));

    supabaseServiceStub.getClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'active_committees_with_creator') {
          return { select: viewSelect };
        }
        if (table === 'committees') {
          return { select: fallbackSelect };
        }
        if (table === 'committee_members') {
          return { select: memberSelect };
        }
        if (table === 'committee_progress') {
          return { select: progressSelect };
        }
        return { select: vi.fn() };
      }),
    });

    const result = await service.listDiscoverableCommittees();

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Harvest Circle');
    expect(fallbackOrder).toHaveBeenCalled();
  });
});
