## Project: Express.js + TypeScript + Supabase Backend

### Directory Structure — Always Follow This for backend

src/
├── features/          # One folder per domain feature
│   └── <name>/
│       ├── <name>.routes.ts       # Express router
│       ├── <name>.controller.ts   # req/res handling only
│       ├── <name>.service.ts      # business logic + all Supabase queries
│       ├── <name>.schema.ts       # Zod validation schemas
│       └── <name>.types.ts        # TypeScript interfaces for this domain
│
├── shared/
│   ├── middleware/    # auth, error, validate middleware
│   ├── utils/         # response helpers, logger, pagination, etc.
│   └── types/         # global type augmentations (express.d.ts, common.types.ts)
│
├── config/
│   ├── env.ts         # Zod-validated env vars — always import env from here
│   ├── supabase.ts    # Supabase singleton client — never instantiate elsewhere
│   └── app.ts         # Express app setup (middlewares, mounts router)
│
├── db/
│   ├── migrations/    # SQL migration files
│   └── seeds/         # seed scripts
│
├── routes/
│   └── index.ts       # Central router — registers all feature routers here
│
└── server.ts          # Entry point — only starts the HTTP server

### Rules — Apply Automatically Without Being Asked

STRUCTURE
- Every new feature gets its own folder under src/features/ with exactly these 5 files:
  routes, controller, service, schema, types
- Never create a feature file outside of its feature folder
- Never import one feature directly into another — use shared/ for cross-feature logic
- Never create barrel index.ts files inside feature folders (circular dep risk)

SUPABASE
- The Supabase client lives only in config/supabase.ts as a singleton
- Only .service.ts files may import and use the Supabase client
- Controllers never query the database directly

ENVIRONMENT VARIABLES
- All env vars are defined and validated with Zod in config/env.ts
- Always import { env } from '../config/env' — never use process.env directly elsewhere

CONTROLLERS
- Controllers only handle req/res: parse input, call service, send response
- No business logic in controllers
- No DB queries in controllers

SERVICES
- All business logic and Supabase queries live here
- Services return plain data or throw errors — they never touch req/res

VALIDATION
- All request validation schemas (Zod) live in <name>.schema.ts
- Apply validation via shared/middleware/validate.middleware.ts on the route level

TYPES
- Feature-specific types go in <name>.types.ts
- Shared/global types go in shared/types/
- Express augmentations (e.g. req.user) go in shared/types/express.d.ts

ROUTING
- Every new feature router must be registered in routes/index.ts
- Route path format: /api/v1/<feature>

ERROR HANDLING
- All errors bubble up to shared/middleware/error.middleware.ts
- Services throw errors with a consistent shape (message + statusCode)
- Controllers never swallow errors silently

RESPONSES
- Always use the response helper from shared/utils/response.util.ts
- Never call res.json() or res.send() with raw objects directly in controllers

NAMING CONVENTIONS
- Files: kebab-case for folders, <name>.<layer>.ts for files
- Classes/Types/Interfaces: PascalCase
- Functions/variables: camelCase
- Zod schemas: camelCase + Schema suffix (e.g. createUserSchema)
- Types from Zod inference: PascalCase + Input suffix (e.g. CreateUserInput)


### When Generating Any Code

1. Always place files in the correct layer — ask yourself: is this a route, controller,
   service, schema, type, middleware, util, or config?
2. If a new feature is being added, scaffold all 5 files at once
3. If shared logic is needed by 2+ features, put it in shared/ — never duplicate
4. Register new routers in routes/index.ts immediately
5. If an env var is needed, add it to config/env.ts with Zod validation first
6. Never hardcode secrets, URLs, or config values inline

### Stack
- Runtime: Node.js
- Language: TypeScript (strict mode)
- Framework: Express.js, typescript
- Database/Auth: Supabase (via @supabase/supabase-js)
- Validation: Zod
- Error handling: Centralized via middleware
