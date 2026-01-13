# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AsterikSuite ERP Backend - A NestJS-based backend API for an ERP system built with TypeScript, Prisma ORM, PostgreSQL, and JWT authentication. The application follows a multi-tenant architecture where users can belong to multiple companies with different roles.

## Development Commands

### Setup and Installation
```powershell
pnpm install
```

### Running the Application
```powershell
# Development mode with hot-reload
pnpm run start:dev

# Production mode
pnpm run start:prod

# Debug mode
pnpm run start:debug
```

### Building
```powershell
pnpm run build
```

### Testing
```powershell
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Generate coverage report
pnpm run test:cov

# Debug tests
pnpm run test:debug
```

### Code Quality
```powershell
# Run linter with auto-fix
pnpm run lint

# Format code with Prettier
pnpm run format
```

### Database Operations
```powershell
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: destructive)
npx prisma migrate reset
```

## Architecture

### Database Schema and Multi-Tenancy

The application uses a **multi-tenant architecture** with the following key relationships:

- **Users** can belong to multiple **Companies** through `user_companies`
- Each `user_companies` entry can have multiple **Roles** via `user_company_roles`
- Companies have their own `schema_name` and `subdomain` for tenant isolation
- Companies can have **Plans** that define features and user limits
- All audit trails are tracked in `audit_logs` with company and user context

Key tables:
- `users` - User accounts with credentials
- `user_profiles` - Extended user information (name, avatar, timezone, etc.)
- `companies` - Tenant organizations
- `user_companies` - Links users to companies
- `roles` - Role definitions (code-based, e.g., "ADMIN", "USER")
- `user_company_roles` - Assigns roles to users within specific companies
- `plans` - Subscription plans with feature sets
- `company_invitations` - Pending invitations to join companies
- `audit_logs` - Activity tracking

### Module Structure

The codebase follows NestJS modular architecture:

#### Core Modules

**PrismaModule** (`src/prisma/`)
- `@Global()` module providing database access throughout the app
- `PrismaService` extends `PrismaClient` with custom PostgreSQL adapter setup
- Handles connection lifecycle (connect on init, disconnect on destroy)
- Uses `@prisma/adapter-pg` for PostgreSQL connection pooling
- Generated Prisma Client is located at `src/generated/prisma/client`

**AuthModule** (`src/auth/`)
- JWT-based authentication using Passport
- `AuthService` handles login, registration, and user validation with bcrypt
- `JwtStrategy` validates JWT tokens and extracts user data
- Guards:
  - `JwtAuthGuard` - Protects routes requiring authentication
  - `RolesGuard` - Checks if user has required roles (uses `@Roles()` decorator)
- DTOs use `class-validator` for input validation
- Login returns user object with flattened roles from all companies

**ProfilesModule** (`src/profiles/`)
- Manages user profile information
- Currently minimal implementation

### Authentication Flow

1. **Registration**: User submits email, password, firstName, lastName → User and UserProfile created
2. **Login**: Email/password validated → JWT token issued with payload: `{ email, sub: userId, roles: [...] }`
3. **Protected Routes**: Use `@UseGuards(JwtAuthGuard)` decorator
4. **Role-Based Access**: Use `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles('ADMIN', 'MANAGER')` decorator

### Key Patterns

**Validation**
- Global `ValidationPipe` configured in `main.ts` with `whitelist: true` and `forbidNonWhitelisted: true`
- All DTOs use `class-validator` decorators (`@IsEmail()`, `@IsNotEmpty()`, `@MinLength()`, etc.)

**Global Prefix**
- All API routes are prefixed with `/api` (configured in `main.ts`)

**Configuration**
- Uses `@nestjs/config` with `ConfigModule.forRoot({ isGlobal: true })`
- Environment variables loaded via `dotenv`
- Required env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT` (optional, defaults to 3000)

**Database Client Generation**
- Prisma Client is generated to `src/generated/prisma/` (not `node_modules`)
- After modifying `prisma/schema.prisma`, always run `npx prisma generate`
- Client uses CommonJS module format (`moduleFormat = "cjs"`)

### TypeScript Configuration

- Uses `nodenext` module resolution
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Target: ES2023
- Strict null checks enabled, but `noImplicitAny` is disabled

## Common Workflows

### Adding a New Feature Module

1. Generate module: `nest g module <feature>`
2. Generate service: `nest g service <feature>`
3. Generate controller: `nest g controller <feature>`
4. Import module in `app.module.ts`
5. Inject `PrismaService` for database access (it's global)

### Adding Database Changes

1. Modify `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name <description>`
3. Regenerate Prisma Client: `npx prisma generate`
4. Update TypeScript code to use new schema
5. Test changes locally before committing

### Protecting Routes

```typescript
// Authentication only
@UseGuards(JwtAuthGuard)
@Get('protected')
async protectedRoute(@Request() req) {
  // req.user contains { userId, email, roles }
}

// Authentication + role check
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Get('admin-only')
async adminRoute() {
  // Only users with ADMIN role can access
}
```

### Working with Multi-Company Context

When working with company-specific data:
1. Extract company context from user (typically from JWT or query param)
2. Filter queries by `company_id`
3. Ensure audit logs include both `user_id` and `company_id`
4. Respect tenant isolation - users should only access data from their assigned companies

## Important Notes

- The Prisma Client is generated to a custom location (`src/generated/prisma`), not `node_modules/@prisma/client`
- Always import from `'src/generated/prisma/client'`, not `'@prisma/client'`
- JWT strategy has a fallback secret for development; ensure `JWT_SECRET` is set in production
- Role checking in `RolesGuard` assumes roles are populated in JWT payload during login
- The database schema uses UUID v4 primary keys generated via `gen_random_uuid()`
- Company invitations use token-based system with expiration
