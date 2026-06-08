import 'dotenv/config'
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { z } from 'zod'
import { createClient, type User } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PORT = Number(process.env.PORT) || 5050

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY',
  )
}

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const createAuthedClient = (token: string) =>
  createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

type AuthRequest = Request & {
  user?: User
  role?: string | null
  token?: string
}

const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const header = req.header('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token.' })
    return
  }

  const { data, error } = await anonClient.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token.' })
    return
  }

  req.user = data.user
  req.role =
    (data.user.app_metadata?.role as string | undefined) ??
    (data.user.user_metadata?.role as string | undefined) ??
    null
  req.token = token
  next()
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1).max(160).optional(),
  role: z
    .enum(['patient', 'doctor', 'assistant', 'admin', 'super_admin'])
    .optional(),
})

app.post('/api/auth/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { email, password, fullName, role } = parsed.data

  const { data, error } = await anonClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName ?? null,
        role: role ?? 'patient',
      },
    },
  })

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  if (data.user) {
    await serviceClient.from('users').upsert({
      id: data.user.id,
      full_name: fullName ?? null,
      role: role ?? 'patient',
    })
  }

  res.json({
    user: data.user,
    session: data.session,
    message: data.session
      ? 'Registered successfully.'
      : 'Check your email to confirm registration.',
  })
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data

  const { data, error } = await anonClient.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json({ user: data.user, session: data.session })
})

app.get('/api/doctors', async (req, res) => {
  const name = String(req.query.name ?? '').trim()
  const disease = String(req.query.disease ?? '').trim()
  const treatment = String(req.query.treatment ?? '').trim()

  let query = anonClient
    .from('doctors')
    .select('id, full_name, treatment_type, disease_focus, clinic_name')
    .order('full_name', { ascending: true })

  if (name) {
    query = query.ilike('full_name', `%${name}%`)
  }

  if (disease) {
    query = query.ilike('disease_focus', `%${disease}%`)
  }

  if (treatment && treatment !== 'all') {
    query = query.eq('treatment_type', treatment)
  }

  const { data, error } = await query

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.json({ doctors: data ?? [] })
})

const appointmentSchema = z.object({
  doctorId: z.string().min(1),
  appointmentDate: z.string().min(1),
  appointmentTime: z.string().min(1),
  notes: z.string().optional(),
  paymentUrl: z.string().url(),
  paymentAmount: z.number().optional(),
})

app.post('/api/appointments', requireAuth, async (req: AuthRequest, res) => {
  const parsed = appointmentSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  if (!req.user || !req.token) {
    res.status(401).json({ error: 'Unauthorized.' })
    return
  }

  const { doctorId, appointmentDate, appointmentTime, notes, paymentUrl, paymentAmount } =
    parsed.data

  const authedClient = createAuthedClient(req.token)

  const { data: appointment, error: appointmentError } = await authedClient
    .from('appointments')
    .insert({
      patient_id: req.user.id,
      doctor_id: doctorId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      status: 'pending',
      notes: notes ?? null,
    })
    .select('id, patient_id, doctor_id, appointment_date, appointment_time, status')
    .single()

  if (appointmentError) {
    res.status(400).json({ error: appointmentError.message })
    return
  }

  const { error: paymentError } = await authedClient.from('payments').insert({
    appointment_id: appointment.id,
    amount: paymentAmount ?? null,
    screenshot_url: paymentUrl,
    status: 'pending',
  })

  if (paymentError) {
    res.status(400).json({ error: paymentError.message })
    return
  }

  res.json({ appointment })
})

const paymentSchema = z.object({
  appointmentId: z.string().min(1),
  paymentUrl: z.string().url(),
  paymentAmount: z.number().optional(),
})

app.post('/api/payments', requireAuth, async (req: AuthRequest, res) => {
  const parsed = paymentSchema.safeParse(req.body)

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  if (!req.token) {
    res.status(401).json({ error: 'Unauthorized.' })
    return
  }

  const { appointmentId, paymentUrl, paymentAmount } = parsed.data
  const authedClient = createAuthedClient(req.token)

  const { data, error } = await authedClient
    .from('payments')
    .insert({
      appointment_id: appointmentId,
      amount: paymentAmount ?? null,
      screenshot_url: paymentUrl,
      status: 'pending',
    })
    .select('id, appointment_id, amount, screenshot_url, status')
    .single()

  if (error) {
    res.status(400).json({ error: error.message })
    return
  }

  res.json({ payment: data })
})

app.get('/api/history', requireAuth, async (req: AuthRequest, res) => {
  if (!req.user || !req.token) {
    res.status(401).json({ error: 'Unauthorized.' })
    return
  }

  const patientId = String(req.query.patientId ?? '').trim() || req.user.id
  const authedClient = createAuthedClient(req.token)

  const [historyResult, prescriptionResult, reportResult] = await Promise.all([
    authedClient
      .from('medical_history')
      .select('id, entry_type, summary, notes, doctor_id, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
    authedClient
      .from('prescriptions')
      .select(
        'id, appointment_id, diagnosis, medications, instructions, doctor_id, created_at',
      )
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
    authedClient
      .from('patient_reports')
      .select('id, appointment_id, file_url, description, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false }),
  ])

  const errorMessage =
    historyResult.error?.message ||
    prescriptionResult.error?.message ||
    reportResult.error?.message

  if (errorMessage) {
    res.status(400).json({ error: errorMessage })
    return
  }

  res.json({
    history: historyResult.data ?? [],
    prescriptions: prescriptionResult.data ?? [],
    reports: reportResult.data ?? [],
  })
})

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: err.message })
})

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Doctor Hub API running on port ${PORT}`)
  })
}

export default app
