# Dil Handicraft — Backend API

FastAPI + SQLAlchemy 2.0 async backend for the Dil Handicraft business management application.

## Features

- **Wholesale Sales** management with shop autocomplete
- **Retail Sales** management with customer autocomplete
- **Purchase/Procurement** tracking with multi-cost breakdown
- **Dashboard** with KPI summary, trend charts, and sales distribution
- **Analytics** with top shops, top suppliers, monthly/daily breakdowns, and CSV export
- **JWT Authentication** (7-day tokens)
- **Period filtering**: today, yesterday, week, month, financial year, calendar year, overall, custom
- **IST (Asia/Kolkata) timezone** awareness

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | ≥0.104 | Web framework |
| SQLAlchemy | ≥2.0.23 | Async ORM |
| Alembic | ≥1.12 | Database migrations |
| Pydantic | ≥2.4 | Data validation |
| pydantic-settings | ≥2.0 | Configuration |
| psycopg | ≥3.1 | PostgreSQL async driver |
| python-jose | ≥3.3 | JWT tokens |
| passlib[bcrypt] | ≥1.7 | Password hashing |
| pytz | ≥2023.3 | Timezone support |

## Project Structure

```
backend/
├── app/
│   ├── main.py          # FastAPI app, middleware, router mounting
│   ├── config.py        # pydantic-settings configuration
│   ├── database.py      # Async engine, session factory, Base
│   ├── models/          # SQLAlchemy ORM models
│   ├── schemas/         # Pydantic request/response schemas
│   ├── routers/         # FastAPI route handlers
│   ├── services/        # Business logic and DB queries
│   └── auth/            # JWT + password utilities
├── alembic/             # Database migrations
├── tests/               # pytest test suite
├── requirements.txt
├── alembic.ini
└── .env.example
```

## Setup

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+

### 2. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual database credentials and secret key
```

### 4. Run Database Migrations

```bash
# From the backend/ directory
alembic upgrade head
```

### 5. Start the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

## First-Time Setup: Create Admin User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-secure-password"}'
```

> The first user can be registered without authentication. Subsequent users require an admin Bearer token.

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/token` | No | Login (returns JWT) |
| POST | `/api/auth/register` | No (first user) | Register user |
| GET | `/api/auth/me` | Yes | Current user info |

### Wholesale Sales
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/wholesale` | Yes | Create sale |
| GET | `/api/wholesale` | Yes | List (filterable, paginated) |
| GET | `/api/wholesale/{id}` | Yes | Get one |
| PUT | `/api/wholesale/{id}` | Yes | Update |
| DELETE | `/api/wholesale/{id}` | Yes | Delete (204) |
| GET | `/api/wholesale/autocomplete/shops` | No | Shop name suggestions |

### Retail Sales
Same pattern as wholesale. Base: `/api/retail`
Autocomplete: `/api/retail/autocomplete/customers`

### Purchases
Same pattern as wholesale. Base: `/api/purchases`
Autocomplete: `/api/purchases/autocomplete/suppliers`

### Dashboard (`/api/dashboard`)
All require auth. All accept `?period=` query param.

| Endpoint | Returns |
|----------|---------|
| `/summary` | KPI totals |
| `/sales-trend` | Daily wholesale + retail |
| `/purchase-trend` | Daily purchase amounts |
| `/profit-trend` | Daily estimated profit |
| `/sales-distribution` | Wholesale vs retail % |

### Analytics (`/api/analytics`)
All require auth.

| Endpoint | Returns |
|----------|---------|
| `/overview` | Same as dashboard summary |
| `/top-shops` | Top 10 shops by sales |
| `/top-suppliers` | Top 10 suppliers by purchase |
| `/monthly-breakdown` | Month-by-month table |
| `/daily-breakdown` | Day-by-day table |
| `/export-csv` | CSV file download |

### Period Options

Pass `?period=<value>` to dashboard/analytics endpoints:

| Value | Description |
|-------|-------------|
| `today` | Current IST date |
| `yesterday` | Yesterday IST |
| `week` | Monday to today |
| `month` | 1st of month to today |
| `financial_year` | April 1 to today |
| `calendar_year` | Jan 1 to today |
| `overall` | All time (no filter) |
| `custom` | Use `start_date` + `end_date` |

## Running Tests

```bash
cd backend
pip install pytest pytest-asyncio httpx aiosqlite anyio
pytest tests/ -v
```

Tests use an in-memory SQLite database — no PostgreSQL needed for testing.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL async URL |
| `SECRET_KEY` | — | JWT signing key (change in production!) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` | Token expiry (7 days) |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated allowed origins |
