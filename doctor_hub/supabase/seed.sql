-- Doctor Hub seed data (replace IDs with real auth user IDs as needed)

insert into clinics (name, address)
values
  ('City Health Center', 'Downtown'),
  ('Lakeside Wellness', 'North District')
on conflict do nothing;

insert into doctors (full_name, treatment_type, disease_focus, clinic_name)
values
  ('Dr. Amal Khan', 'allopathic', 'cardiology', 'City Health Center'),
  ('Dr. Rohan Patel', 'homeopathic', 'respiratory', 'Lakeside Wellness'),
  ('Dr. Aisha Noor', 'herbal', 'digestive', 'City Health Center')
on conflict do nothing;

-- Example schedule (replace <DOCTOR_USER_ID> and <CLINIC_ID>)
-- insert into doctor_schedules (doctor_id, clinic_id, day_of_week, start_time, end_time, notes)
-- values ('<DOCTOR_USER_ID>', '<CLINIC_ID>', 'Monday', '09:00', '13:00', 'Walk-ins');

-- Example appointment (replace <PATIENT_USER_ID> and <DOCTOR_USER_ID>)
-- insert into appointments (patient_id, doctor_id, appointment_date, appointment_time, status, notes)
-- values ('<PATIENT_USER_ID>', '<DOCTOR_USER_ID>', current_date, '10:30', 'pending', 'Initial consultation');
