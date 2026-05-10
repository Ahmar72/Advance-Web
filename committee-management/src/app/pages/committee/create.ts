import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommitteeService } from '../../services/committee.service';

@Component({
  selector: 'app-committee-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create.html',
  styleUrls: ['./create.scss'],
})
export class CommitteeCreateComponent implements OnInit {
  isSubmitting = false;
  error: string | null = null;
  form;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private committeeService: CommitteeService,
    private router: Router
  ) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(1000)]],
      duration_months: [10, [Validators.required, Validators.min(1)]],
      monthly_amount: [0, [Validators.required, Validators.min(1)]],
      max_members: [10, [Validators.required, Validators.min(2), Validators.max(10)]],
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      if (!user) {
        this.router.navigate(['/login']);
      }
    });
  }

  get title() {
    return this.form.controls.title;
  }

  get description() {
    return this.form.controls.description;
  }

  get durationMonths() {
    return this.form.controls.duration_months;
  }

  get monthlyAmount() {
    return this.form.controls.monthly_amount;
  }

  get maxMembers() {
    return this.form.controls.max_members;
  }

  get estimatedPool() {
    const monthlyAmount = Number(this.monthlyAmount.value || 0);
    const durationMonths = Number(this.durationMonths.value || 0);
    const maxMembers = Number(this.maxMembers.value || 0);
    const total = monthlyAmount * durationMonths * maxMembers;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(total || 0);
  }

  get monthlyContributionDisplay() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(Number(this.monthlyAmount.value || 0));
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const user = this.authService.getCurrentUserValue();
    if (!user) {
      this.error = 'You must be signed in to create a committee.';
      console.error('No user found:', user);
      return;
    }

    console.log('=== Starting committee creation ===');
    console.log('User ID:', user.id);
    console.log('Form values:', this.form.value);
    
    this.isSubmitting = true;
    this.error = null;

    try {
      const payload = {
        title: this.title.value?.trim() || '',
        description: this.description.value?.trim() || '',
        duration_months: Number(this.durationMonths.value),
        monthly_amount: Number(this.monthlyAmount.value),
        max_members: Number(this.maxMembers.value),
      };

      console.log('Sending payload:', payload);
      
      const { data, error } = await this.committeeService.createCommittee(payload, user.id);

      console.log('=== Response received ===');
      console.log('Data:', data);
      console.log('Error:', error);
      console.log('Error type:', error?.constructor?.name);
      console.log('Full error object:', JSON.stringify(error, null, 2));

      this.isSubmitting = false;

      if (error) {
        console.error('❌ Committee creation FAILED:', error);
        const errorMessage = 
          typeof error === 'string' ? error :
          error?.message ? error.message :
          JSON.stringify(error);
        this.error = `Error: ${errorMessage}`;
        return;
      }

      if (!data) {
        console.error('❌ No data returned');
        this.error = 'Server returned no data';
        return;
      }

      console.log('✅ Committee created successfully:', data);
      this.router.navigate(['/committee', data.id]);
    } catch (err: any) {
      console.error('❌ UNEXPECTED ERROR:', err);
      this.isSubmitting = false;
      this.error = err?.message || 'An unexpected error occurred';
    }
  }
}
