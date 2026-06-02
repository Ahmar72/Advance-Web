-- Doctor Hub RLS policies

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role'
  );
$$;

alter table users enable row level security;
alter table doctors enable row level security;
alter table patients enable row level security;
alter table assistants enable row level security;
alter table clinics enable row level security;
alter table appointments enable row level security;
alter table payments enable row level security;
alter table prescriptions enable row level security;
alter table medical_history enable row level security;
alter table patient_reports enable row level security;
alter table doctor_schedules enable row level security;
alter table messages enable row level security;

-- users
create policy "users_read_self" on users
  for select
  using (id = auth.uid());

create policy "users_insert_self" on users
  for insert
  with check (id = auth.uid());

create policy "users_admin_manage" on users
  for update
  using (current_user_role() in ('admin', 'super_admin'));

create policy "users_admin_read" on users
  for select
  using (current_user_role() in ('admin', 'super_admin'));

create policy "users_update_self" on users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- doctors (public read for search)
create policy "doctors_read_all" on doctors
  for select
  using (true);

create policy "doctors_admin_read" on doctors
  for select
  using (current_user_role() in ('admin', 'super_admin'));

create policy "doctors_admin_insert" on doctors
  for insert
  with check (current_user_role() in ('admin', 'super_admin'));

-- patients
create policy "patients_read_self" on patients
  for select
  using (user_id = auth.uid());

create policy "patients_insert_self" on patients
  for insert
  with check (user_id = auth.uid());

-- assistants
create policy "assistants_admin_manage" on assistants
  for all
  using (current_user_role() in ('admin', 'super_admin'))
  with check (current_user_role() in ('admin', 'super_admin'));

create policy "assistants_self_read" on assistants
  for select
  using (user_id = auth.uid());

create policy "assistants_doctor_read" on assistants
  for select
  using (assigned_doctor_id = auth.uid());

-- clinics
create policy "clinics_admin_manage" on clinics
  for all
  using (current_user_role() in ('admin', 'super_admin'))
  with check (current_user_role() in ('admin', 'super_admin'));

create policy "clinics_read_all" on clinics
  for select
  using (true);

create policy "clinics_admin_read" on clinics
  for select
  using (current_user_role() in ('admin', 'super_admin'));

-- doctor schedules
create policy "schedules_doctor_read" on doctor_schedules
  for select
  using (doctor_id = auth.uid());

create policy "schedules_admin_read" on doctor_schedules
  for select
  using (current_user_role() in ('admin', 'super_admin'));

create policy "schedules_doctor_insert" on doctor_schedules
  for insert
  with check (doctor_id = auth.uid());

create policy "schedules_doctor_update" on doctor_schedules
  for update
  using (doctor_id = auth.uid())
  with check (doctor_id = auth.uid());

create policy "schedules_doctor_delete" on doctor_schedules
  for delete
  using (doctor_id = auth.uid());

-- appointments
create policy "appointments_patient_read" on appointments
  for select
  using (patient_id = auth.uid());

create policy "appointments_doctor_read" on appointments
  for select
  using (doctor_id = auth.uid());

create policy "appointments_assistant_read" on appointments
  for select
  using (current_user_role() = 'assistant');

create policy "appointments_admin_read" on appointments
  for select
  using (current_user_role() in ('admin', 'super_admin'));

create policy "appointments_patient_insert" on appointments
  for insert
  with check (patient_id = auth.uid() and current_user_role() = 'patient');

create policy "appointments_assistant_update" on appointments
  for update
  using (current_user_role() = 'assistant')
  with check (current_user_role() = 'assistant');

-- payments
create policy "payments_patient_insert" on payments
  for insert
  with check (current_user_role() = 'patient');

create policy "payments_assistant_read" on payments
  for select
  using (current_user_role() = 'assistant');

create policy "payments_admin_read" on payments
  for select
  using (current_user_role() in ('admin', 'super_admin'));

create policy "payments_assistant_update" on payments
  for update
  using (current_user_role() = 'assistant')
  with check (current_user_role() = 'assistant');

-- prescriptions (immutable)
create policy "prescriptions_doctor_insert" on prescriptions
  for insert
  with check (current_user_role() = 'doctor');

create policy "prescriptions_patient_read" on prescriptions
  for select
  using (patient_id = auth.uid());

create policy "prescriptions_doctor_read" on prescriptions
  for select
  using (doctor_id = auth.uid());

create policy "prescriptions_admin_read" on prescriptions
  for select
  using (current_user_role() in ('admin', 'super_admin'));

-- medical history (immutable)
create policy "history_doctor_insert" on medical_history
  for insert
  with check (current_user_role() = 'doctor');

create policy "history_patient_read" on medical_history
  for select
  using (patient_id = auth.uid());

create policy "history_doctor_read" on medical_history
  for select
  using (
    doctor_id = auth.uid()
    or exists (
      select 1
      from appointments a
      where a.patient_id = medical_history.patient_id
        and a.doctor_id = auth.uid()
    )
  );

create policy "history_admin_read" on medical_history
  for select
  using (current_user_role() in ('admin', 'super_admin'));

-- patient reports
create policy "reports_patient_read" on patient_reports
  for select
  using (patient_id = auth.uid());

create policy "reports_patient_insert" on patient_reports
  for insert
  with check (patient_id = auth.uid());

create policy "reports_doctor_read" on patient_reports
  for select
  using (
    exists (
      select 1
      from appointments a
      where a.patient_id = patient_reports.patient_id
        and a.doctor_id = auth.uid()
    )
  );

create policy "reports_admin_read" on patient_reports
  for select
  using (current_user_role() in ('admin', 'super_admin'));

-- messages
create policy "messages_sender_insert" on messages
  for insert
  with check (sender_id = auth.uid());

create policy "messages_participant_read" on messages
  for select
  using (sender_id = auth.uid() or receiver_id = auth.uid());

create policy "messages_admin_read" on messages
  for select
  using (current_user_role() in ('admin', 'super_admin'));
