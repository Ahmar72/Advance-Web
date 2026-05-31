-- Doctor Hub core schema (minimal columns used by UI + policies)

create table if not exists users (
  id uuid primary key references auth.users(id),
  full_name text,
  role text not null check (role in ('patient', 'doctor', 'assistant', 'admin', 'super_admin')),
  created_at timestamptz default now()
);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  full_name text not null,
  treatment_type text not null,
  disease_focus text,
  clinic_name text,
  created_at timestamptz default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  full_name text not null,
  date_of_birth date,
  created_at timestamptz default now()
);

create table if not exists clinics (
  id uuid primary key default gen_random_uuid(),
  name text,
  address text,
  created_at timestamptz default now()
);

create table if not exists doctor_schedules (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references auth.users(id),
  clinic_id uuid references clinics(id),
  day_of_week text not null,
  start_time time not null,
  end_time time not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id),
  doctor_id uuid not null references auth.users(id),
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id),
  amount numeric,
  screenshot_url text,
  status text not null default 'pending',
  created_at timestamptz default now()
);

create table if not exists prescriptions (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id),
  doctor_id uuid not null references auth.users(id),
  patient_id uuid not null references auth.users(id),
  diagnosis text not null,
  medications text,
  instructions text,
  created_at timestamptz default now()
);

create table if not exists medical_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id),
  doctor_id uuid not null references auth.users(id),
  entry_type text not null,
  summary text not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id),
  receiver_id uuid not null references auth.users(id),
  appointment_id uuid references appointments(id),
  body text not null,
  created_at timestamptz default now()
);
