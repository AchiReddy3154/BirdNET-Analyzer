# BirdNET Analyzer

BirdNET Analyzer is a monorepo for exploring bird audio with a React frontend, a Node API, and a Python Flask BirdNET service.

## What is here

- `artifacts/birdnet-app` - React/Vite frontend
- `artifacts/api-server` - Express API server
- `birdnet-api` - Python Flask analysis service
- `lib/db` - shared database schema
- `lib/api-spec` - OpenAPI spec and generated client code
- `scripts` - local developer tooling

## Run locally

Use the single launcher from the repository root:

```bash
pnpm run dev:easy
```

That starts:

- Frontend on `http://localhost:5173`
- Node API on `http://localhost:8081`
- BirdNET Flask API on `http://localhost:8000`

To stop the local listeners:

```bash
pnpm run dev:stop
```

## Requirements

- Node.js with `pnpm`
- Python environment for `birdnet-api`
- A PostgreSQL `DATABASE_URL` for the Node API

## Notes

- Upload the root `audio-inputs` folder for sample audio, but keep generated runtime files out of Git.
- The repository uses a lightweight local login session for the UI.
- History and stats are backed by the database configured through `DATABASE_URL`.
