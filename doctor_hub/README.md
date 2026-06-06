# Doctor Hub

Doctor Hub is a healthcare consultation and patient history management system built with React (Vite) and Supabase. The app supports separate dashboards for Patient, Doctor, Assistant, Admin, and Super Admin roles.
![alt text](../../../images/1.png)
## Core Features

- Doctor search by disease and treatment type
- Appointment booking with payment verification workflow
- Immutable medical history and prescriptions
- Role-based dashboards with Supabase Auth + RLS
- Assistant payment verification queue
- Admin doctor management

## Tech Stack

- React + TypeScript (Vite)
- Supabase Auth + Database
- React Router
- Express REST API (server folder)

## Environment Variables

Create a `.env` file in the project root (copy from `.env.example`):

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5050
```

Create a `.env` file inside `server/` (copy from `server/.env.example`):

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=5050
```

## Supabase Setup

1. Create a Supabase project.
2. Add the site URL and redirect URLs in Auth settings (include your local dev URL).
3. Run the SQL in [supabase/schema.sql](supabase/schema.sql) and then [supabase/rls.sql](supabase/rls.sql).
4. Set user roles in Auth metadata using `role` (patient, doctor, assistant, admin, super_admin).
5. (Optional) Load sample data from [supabase/seed.sql](supabase/seed.sql).
6. Create storage buckets: `patient-reports` and `payment-screenshots`.

## Getting Started

```
npm install
npm run dev
```

### API Server

```
cd server
npm install
npm run dev
```

Health check:

```
cd server
npm run health
```

Available REST endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/doctors`
- `POST /api/appointments`
- `POST /api/payments`
- `GET /api/history`

## Supabase Table Expectations

The UI expects the following tables (adjust columns if you want different naming):

- `users`: `id`
- `doctors`: `id`, `full_name`, `treatment_type`, `disease_focus`, `clinic_name`
- `appointments`: `id`, `patient_id`, `doctor_id`, `appointment_date`, `appointment_time`, `status`, `notes`
- `payments`: `id`, `appointment_id`, `amount`, `screenshot_url`, `status`, `created_at`
- `prescriptions`: `id`, `appointment_id`, `doctor_id`, `patient_id`, `diagnosis`, `medications`, `instructions`
- `medical_history`: `id`, `patient_id`, `doctor_id`, `entry_type`, `summary`, `notes`
- `patient_reports`: `id`, `patient_id`, `appointment_id`, `file_path`, `file_url`, `description`
- `clinics`: `id`
- `doctor_schedules`: `id`, `doctor_id`, `clinic_id`, `day_of_week`, `start_time`, `end_time`, `notes`
- `messages`: `id`, `sender_id`, `receiver_id`, `appointment_id`, `body`, `created_at`

## Role Mapping

Roles are stored in Supabase Auth `user_metadata.role` or `app_metadata.role`:

- `patient`
- `doctor`
- `assistant`
- `admin`
- `super_admin`

## Notes

- Medical history and prescriptions are write-only in the UI to reflect immutable policies.
- Payment screenshots are currently saved as URLs; use Supabase Storage if you want file uploads.
- Profile updates write to the `users` table after login.
