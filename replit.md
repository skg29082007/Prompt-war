# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Applications

### VenueFlow (`artifacts/venueflow`)
Real-time physical event experience management system for large-scale sporting venues.
- **Frontend**: React + Vite + Tailwind CSS (dark navy/electric blue theme)
- **Preview path**: `/`
- **Pages**: Home (role selector), Staff Dashboard, Attendee View, Analytics
- **Features**: Live zone occupancy heatmap, virtual queue management, active alerts, staff coordination chat, post-event analytics charts

### API Server (`artifacts/api-server`)
Express 5 REST API serving VenueFlow data.
- **Routes**: /api/zones, /api/queues, /api/alerts, /api/analytics, /api/staff/messages

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- **zones** — venue zones with occupancy counts, coordinates, capacity
- **queues** — virtual queues linked to zones
- **queue_entries** — individual attendee queue entries with positions
- **alerts** — venue alerts (overcrowding, long_wait, gate_closed, rebalance_suggested)
- **staff_messages** — staff coordination chat messages

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
