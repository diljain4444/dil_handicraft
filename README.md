# Dil Handicraft — Business Management & Analytics System

A production-oriented, mobile-first business management and financial tracking application designed specifically for **Dil Handicraft**, a handicraft and gift products business.

The system is built to provide simple, reliable, and instant business overview and transaction management across Wholesale Sales, Retail Sales, and Purchase Management with PostgreSQL database persistence and Asia/Kolkata timezone awareness.

---

## Architecture Overview

```
dil_handicraft/
├── backend/                  # FastAPI + SQLAlchemy 2.0 Async + Alembic
│   ├── app/
│   │   ├── main.py           # Application entrypoint & CORS middleware
│   │   ├── config.py         # Pydantic-settings configuration
│   │   ├── database.py       # Async SQLAlchemy engine & session factory
│   │   ├── models/           # wholesale_sales, retail_sales, purchases, users
│   │   ├── schemas/          # Pydantic v2 validation models
│   │   ├── routers/          # REST API endpoints (auth, wholesale, retail, purchases, dashboard, analytics)
│   │   ├── services/         # Business logic, aggregations, IST date filters, CSV export
│   │   └── auth/             # JWT token handling & password hashing
│   ├── alembic/              # Async PostgreSQL database migrations
│   ├── tests/                # 29 Pytest async integration tests
│   ├── alembic.ini           # Migration configuration
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment template
│
└── frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS + PWA
    ├── src/
    │   ├── components/
    │   │   ├── layout/       # AppShell, BottomNav, Sidebar, Header
    │   │   ├── ui/           # KPICard, PeriodSelector, TransactionCard, Combobox, Modal, Badge, etc.
    │   │   ├── charts/       # SalesDistribution, SalesTrend, PurchaseTrend, ProfitTrend (Recharts)
    │   │   ├── forms/        # WholesaleForm, RetailForm, PurchaseForm (with live math & autocomplete)
    │   │   └── fab/          # Floating Action Button (Speed dial with 3 quick-add actions)
    │   ├── pages/            # DashboardPage, TransactionsPage, AnalyticsPage, LoginPage, MorePage
    │   ├── hooks/            # TanStack React Query hooks for real-time syncing
    │   ├── lib/api.ts        # Axios client with JWT interceptors
    │   ├── types/            # TypeScript data contracts
    │   └── utils/format.ts   # INR currency (₹) & Asia/Kolkata date formatting
    ├── public/               # PWA manifests, icons, favicon
    ├── package.json
    └── vite.config.ts        # Vite config with PWA plugin & dev proxy
```

---

## 1. Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: v18 or higher (with `pnpm` or `npm`)
- **PostgreSQL**: 14 or higher

---

## 2. Backend Setup & Run Instructions

### Step 1: Create Virtual Environment
Open a terminal (PowerShell or Bash) and navigate to the backend folder:
```powershell
cd "c:\Users\DIL JAIN\Desktop\agentic\dil_handicraft\backend"
python -m venv .venv
```

Activate the virtual environment:
- **Windows (PowerShell)**:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (CMD)**:
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- **Linux / macOS**:
  ```bash
  source .venv/bin/activate
  ```

### Step 2: Install Backend Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Configure Database Credentials
Copy the example environment file and edit it with your PostgreSQL credentials:
```powershell
copy .env.example .env
```
Open `.env` and set your PostgreSQL connection string:
```ini
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/dil_handicraft
SECRET_KEY=change-this-to-a-secure-random-secret-key-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

> **Note**: In PostgreSQL, make sure the database `dil_handicraft` is created:
> ```sql
> CREATE DATABASE dil_handicraft;
> ```

### Step 4: Run Database Migrations
Apply the initial schema to create all tables and indexes in PostgreSQL:
```powershell
alembic upgrade head
```

### Step 5: Run Automated Tests
Run the complete test suite (uses an isolated in-memory SQLite database):
```powershell
pytest -v
```
*(All 29 tests will run and pass).*

### Step 6: Start FastAPI Backend
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

---

## 3. Frontend Setup & Run Instructions

Open a second terminal window and navigate to the frontend folder:

### Step 1: Install Frontend Dependencies
```powershell
cd "c:\Users\DIL JAIN\Desktop\agentic\dil_handicraft\frontend"
pnpm install
```
*(Or `npm install` if using npm)*

### Step 2: Verify Configuration
The frontend communicates with the backend at `http://localhost:8000`. This is pre-configured in `.env`:
```ini
VITE_API_URL=http://localhost:8000
```

### Step 3: Start React Development Server
```powershell
pnpm dev
```
Open your browser or mobile device on your local network:
`http://localhost:5173`

### Step 4: Build for Production
To build the optimized production PWA bundle:
```powershell
pnpm build
```
The output will be generated in `frontend/dist/` ready to be served by any static web server or CDN.

---

## 4. First-Time Owner Login & Account Setup

1. Open `http://localhost:5173` in your browser.
2. Click **"First-time setup? Create Admin Account"** at the bottom of the login card.
3. Enter your father's preferred username (e.g. `admin` or your father's name) and password.
4. Click **"Create Admin Account"**.
5. The application will create the owner account, automatically issue a 7-day secure JWT token, and redirect directly to the Dashboard.

---

## 5. Key Feature Highlights

### 🛍 1. Wholesale Sales Module
- Autocomplete for shop names based on previously saved transactions.
- Selling amount in INR (₹).
- Manual estimated profit input.
- Editable transaction date with default set to today in Asia/Kolkata timezone.
- Optional notes.

### 🛒 2. Retail Sales Module
- Streamlined for walk-in shop customers.
- Optional customer label (defaults gracefully to simple identifier if blank).
- Immediate entry with selling amount and estimated profit.

### 📦 3. Purchase Management Module
- Supplier name with autocomplete.
- Product category / description.
- Itemized cost tracking: Purchase Amount, Packing Cost, Parcel/Transportation Cost, Other Expenses.
- Live automatic expenditure calculation:
  $$\text{Total Expenditure} = \text{Purchase Amount} + \text{Packing} + \text{Parcel} + \text{Other}$$

### 📊 4. Central Dashboard & KPI Cards
- Total Sales (Wholesale + Retail)
- Wholesale Sales
- Retail Sales
- Total Purchase Expenditure
- Estimated Profit (Sum of manually entered sales profit)
- Total Additional Purchase Expenses (Packing + Parcel + Other)
- **Period Filter**: Today | Yesterday | This Week | This Month | This Financial Year (April 1 – March 31) | This Calendar Year | Overall | Custom Date Range
- **Visual Analytics**: Sales Distribution Donut Chart, Sales Trend Line Chart, Purchase Trend Bar Chart, Profit Trend Line Chart.

### 📝 5. Transaction History & Filtering
- Unified view for all transaction types with visual badges.
- Filter by type: All, Wholesale, Retail, Purchase.
- Search by shop name, customer label, or supplier name.
- Sort by newest or oldest.
- Edit existing transactions or delete with a safety confirmation modal.

### 📈 6. Analytics & CSV Export
- Top wholesale shops by revenue.
- Top suppliers by purchase expenditure.
- Monthly performance breakdown.
- One-click **Export CSV** download of all transactions for the selected period.

### 📱 7. Mobile-First UX & PWA
- Optimized for Android mobile screens with high-contrast readable typography and comfortable minimum 44px touch targets.
- Fixed bottom navigation bar + floating Quick-Add action button.
- Configured as a Progressive Web App (PWA) with manifest, offline service worker, and mobile home screen installation support.
