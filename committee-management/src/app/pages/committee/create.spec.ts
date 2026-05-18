import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, RouterLink } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { CommitteeCreateComponent } from './create';
import { AuthService } from '../../services/auth.service';
import { CommitteeService } from '../../services/committee.service';

describe('CommitteeCreateComponent', () => {
  const currentUser$ = new BehaviorSubject({ id: 'user-1', email: 'creator@example.com' });
  const authServiceStub = {
    currentUser$: currentUser$.asObservable(),
    getCurrentUserValue: () => currentUser$.value,
  } as Partial<AuthService>;

  const committeeServiceStub = {
    createCommittee: vi.fn().mockResolvedValue({
      data: { id: 'committee-1' },
      error: null,
    }),
    createdCommittee$: new BehaviorSubject(null),
    committeeUpdated$: new BehaviorSubject(null),
  } as any;

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CommonModule, CommitteeCreateComponent, RouterLink],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceStub },
        { provide: CommitteeService, useValue: committeeServiceStub },
      ],
    }).compileComponents();
  });

  it('creates a committee with the form values', async () => {
    const fixture = TestBed.createComponent(CommitteeCreateComponent);
    const component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.detectChanges();

    component.form.setValue({
      title: 'Monthly Savings Circle',
      description: '10 month rotating committee',
      duration_months: 10,
      monthly_amount: 150,
      max_members: 10,
    });

    await component.submit();

    expect(committeeServiceStub.createCommittee).toHaveBeenCalledWith(
      {
        title: 'Monthly Savings Circle',
        description: '10 month rotating committee',
        duration_months: 10,
        monthly_amount: 150,
        max_members: 10,
      },
      'user-1'
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/committee', 'committee-1']);
  });

  it('marks the form invalid when required values are missing', async () => {
    const fixture = TestBed.createComponent(CommitteeCreateComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    component.form.patchValue({
      title: '',
      monthly_amount: 0,
    });

    await component.submit();

    expect(component.form.invalid).toBe(true);
    expect(committeeServiceStub.createCommittee).not.toHaveBeenCalled();
  });
});
