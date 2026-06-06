# Doctor Hub

Doctor Hub is a healthcare consultation and patient history management system built with React (Vite) and Supabase. The app supports separate dashboards for Patient, Doctor, Assistant, Admin, and Super Admin roles.
<img width="941" height="422" alt="1" src="https://github.com/user-attachments/assets/c9965e1b-64d7-4baa-b8f9-5007f6022c12" />
<img width="772" height="259" alt="2" src="https://github.com/user-attachments/assets/436d76b1-a4b1-4c62-930a-4ac227c6a0da" />
<img width="780" height="307" alt="3" src="https://github.com/user-attachments/assets/cbe163e3-a143-4a45-a9e8-951cd404a8e3" />
<img width="937" height="413" alt="4" src="https://github.com/user-attachments/assets/75bb43b9-0e5a-4c17-8683-e8cda06a2af2" />
<img width="782" height="269" alt="5" src="https://github.com/user-attachments/assets/0e818d32-30d6-4a1b-8f2e-4d1d3a8ef68f" />
<img width="784" height="290" alt="6" src="https://github.com/user-attachments/assets/ea2a4382-bf74-4b99-b36e-f3147fff2fa8" />
<img width="788" height="386" alt="7" src="https://github.com/user-attachments/assets/35f4ddb6-7148-4ecd-859c-f2ed852bf845" />
<img width="781" height="395" alt="8" src="https://github.com/user-attachments/assets/1f69dba2-e6c9-4ee4-812e-11925b9918ce" />
<img width="800" height="331" alt="9" src="https://github.com/user-attachments/assets/2a469322-3363-4a87-b87e-1295f543b0e3" />
<img width="770" height="438" alt="11" src="https://github.com/user-attachments/assets/4f3c1d1d-d5ac-48c0-8485-8addfb299555" />
<img width="788" height="325" alt="10" src="https://github.com/user-attachments/assets/756a951f-37a0-45c6-bfb1-9eb46a766829" />
<img width="764" height="434" alt="12" src="https://github.com/user-attachments/assets/8d15413e-a5b0-4650-9675-ed37fb8c66a0" />
<img width="800" height="335" alt="13" src="https://github.com/user-attachments/assets/eb0d2b01-649f-4516-abf4-a766c79842fd" />
<img width="783" height="317" alt="14" src="https://github.com/user-attachments/assets/26ca9054-ec4b-48de-8b1f-9434634df546" />
<img width="800" height="198" alt="17" src="https://github.com/user-attachments/assets/d69f3609-7317-4b68-bd6e-0f5116701b2f" />
<img width="788" height="287" alt="16" src="https://github.com/user-attachments/assets/a8206838-9d2a-4d45-9ec9-15dd8d8ec81d" />
<img width="353" height="368" alt="15" src="https://github.com/user-attachments/assets/c52d274d-02f5-473b-9561-d4fb920014a4" />
<img width="791" height="368" alt="18" src="https://github.com/user-attachments/assets/3ae65a95-72b4-4464-9e21-2e5b78f6e86f" />
<img width="783" height="244" alt="19" src="https://github.com/user-attachments/assets/7e296bc6-1981-4c9c-909c-61544a00f422" />

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
