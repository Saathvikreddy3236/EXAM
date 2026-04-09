# Full-Stack Starter

This project includes:

- `backend`: Node.js + Express API with PostgreSQL connection support
- `frontend`: React app built with Vite

## Quick start

1. Install dependencies:

```bash
npm run install:all
```

2. Configure PostgreSQL for the backend:

```bash
cd backend
copy .env.example .env
```

Update the values in `backend/.env` to match your PostgreSQL server.

Important: `.env.example` is only a template. The backend reads `backend/.env`, not `backend/.env.example`.

Optional frontend API override:

```bash
cd ..\frontend
copy .env.example .env
```

3. Start both apps:

```bash
cd ..
npm run dev
```

## Default ports

- Frontend: `5173`
- Backend: `5000`

## API endpoints

- `GET /api/health`
- `GET /api/db-check`
