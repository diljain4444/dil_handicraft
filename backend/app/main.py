"""FastAPI application entry point for Dil Handicraft backend."""

import asyncio
import logging
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

# On Windows, psycopg async requires WindowsSelectorEventLoopPolicy
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import auth, wholesale, retail, purchases, dashboard, analytics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    logger.info("Starting Dil Handicraft API server...")
    yield
    logger.info("Shutting down Dil Handicraft API server...")


# Create the FastAPI app
app = FastAPI(
    title="Dil Handicraft API",
    description="Business management API for Dil Handicraft — wholesale, retail, and purchase tracking.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware - allows localhost, local Wi-Fi devices, and deployed domains (Vercel, Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log each incoming HTTP request with method, path, and response time."""
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} → {response.status_code} ({duration_ms:.1f}ms)"
    )
    return response


# Health check endpoint
@app.get("/health", tags=["health"], summary="Health check")
async def health_check():
    """Return server health status."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "Dil Handicraft API",
    }


# Mount all routers under /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(wholesale.router, prefix="/api")
app.include_router(retail.router, prefix="/api")
app.include_router(purchases.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """API root — redirect hint for clients."""
    return {"message": "Dil Handicraft API", "docs": "/docs", "health": "/health"}
