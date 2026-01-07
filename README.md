# PulseOps Lite

A lightweight operations monitoring platform built with Next.js.

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (via Vercel Postgres or local)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your database credentials and secrets.

### 3. Run database migrations

```bash
pnpm tsx lib/db/migrate.ts
```

### 4. Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |

## API Endpoints

### Health Check

```
GET /api/health
```

Returns system health status with correlation ID for request tracing.

## Project Structure

```
├── app/                  # Next.js App Router
│   ├── api/              # API routes
│   └── page.tsx          # Home page
├── components/           # React components
│   └── ui/               # UI primitives
├── lib/                  # Utilities
│   ├── db/               # Database connector
│   └── design/           # Design tokens
├── db/migrations/        # SQL migrations
├── tests/                # Test files
└── docs/                 # Documentation
```

## Documentation

- [Runbook](./docs/runbook.md) - How to run, test, and debug
- [Architecture](./docs/architecture.md) - System architecture overview
- [PRD](./docs/PRD.md) - Product requirements

## License

Private
