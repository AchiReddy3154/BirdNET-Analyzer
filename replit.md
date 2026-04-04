# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.
Also includes a standalone Python Flask service for BirdNET audio analysis.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (Node.js), Flask 3 (Python)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **ML**: BirdNET (via birdnetlib + TensorFlow CPU) for bird species identification from audio

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `cd birdnet-api && python app.py` — run BirdNET Flask API (port 8000)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## BirdNET Flask API (`birdnet-api/`)

Standalone Python Flask API for bird sound identification.

- `app.py` — Flask application with upload handling and routing
- `analyzer.py` — BirdNET wrapper using birdnetlib
- `requirements.txt` — Python dependencies
- Runs on port 8000 (workflow: "BirdNET Flask API")
