# Backend (FastAPI) Scaffold

FastAPI-based backend replacing Supabase functions. Deploy on Render with Gunicorn.

## Implemented
- Visitor registration: `/api/visitors/register`
- Access code generation & verification: `/api/access-codes/generate`, `/api/access-codes/verify`
- AES-GCM encryption, Argon2 PIN hashing, JWT (RS256 if keys provided else HS256 fallback)

## TODO
1. Complete Postgres adoption (models + migrations added; wire real DB URL & run Alembic upgrade).
2. Invitation validation, email queue, analytics, guard/admin endpoints.
3. RBAC: implement role claims (header or JWT) and enforce in route dependencies.
4. Logging, metrics, rate limiting.
5. Index optimization (avoid full scan for PIN verification; add surrogate hashed PIN lookup table).

## Local Dev
```bash
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.backend.example .env
uvicorn app.main:app --reload --port 8000
```

## Database Migrations
Set `DATABASE_URL` then:
```bash
alembic upgrade head
```

## Render Deployment
Build Command:
```bash
pip install -r requirements.txt
```
Start Command:
```bash
gunicorn app.main:app -k uvicorn.workers.UvicornWorker --log-level info --bind 0.0.0.0:$PORT
```

## Test
```bash
pytest -q
```
