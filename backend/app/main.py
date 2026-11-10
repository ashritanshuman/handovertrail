import os
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.config import settings
from app.db import init_db, SessionLocal
from app.fixtures.seed_data import seed_database
from app.models import Project

# Configure safe structured logger (never logs request bodies or API keys)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("handovertrail")

# Routers
from app.routers import (
    demo,
    project,
    evidence,
    extract,
    claims,
    gaps,
    timeline,
    stats,
    handover,
    audit,
    ask,
    sources,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables (with WAL mode enabled on connect)
    init_db()
    # Check if DB has been seeded, if not seed it on startup
    db = SessionLocal()
    try:
        existing_proj = db.query(Project).filter(Project.id == "campusconnect").first()
        if not existing_proj:
            seed_database(db, force_reset=False)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Structured Request/Response Logging Middleware (never logs request body or secrets)
@app.middleware("http")
async def safe_logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    user_header = request.headers.get("x-user-id", "-")
    # Sanitize user_header to avoid log injection
    safe_user = "".join(c for c in user_header if c.isalnum() or c in "-_")[:30]

    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    logger.info(
        f"[HTTP] {request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms) user={safe_user}"
    )
    return response


# Safe Global Exception Handler (returns safe JSON, no stack traces, no secrets)
@app.exception_handler(Exception)
async def safe_global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=exc.headers,
        )
    # Log internal error without exposing sensitive internals
    logger.error(f"[ERROR] {request.method} {request.url.path}: {type(exc).__name__} - {str(exc)[:200]}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


# Health endpoint
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "app": "HandoverTrail",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }


# Include Routers
app.include_router(demo.router)
app.include_router(project.router)
app.include_router(evidence.router)
app.include_router(extract.router)
app.include_router(claims.router)
app.include_router(gaps.router)
app.include_router(timeline.router)
app.include_router(stats.router)
app.include_router(handover.router)
app.include_router(audit.router)
app.include_router(ask.router)
app.include_router(sources.router)


# Static File Serving & Single-Service SPA Routing
frontend_dist_path = settings.FRONTEND_DIST
if not os.path.isabs(frontend_dist_path):
    # Resolve relative to project root or backend root
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    frontend_dist_path = os.path.abspath(os.path.join(base_dir, frontend_dist_path))
    if not os.path.exists(frontend_dist_path):
        # Fallback relative to backend folder
        frontend_dist_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.dirname(__file__)), settings.FRONTEND_DIST)
        )

if os.path.exists(frontend_dist_path) and os.path.exists(os.path.join(frontend_dist_path, "index.html")):
    # Mount assets folder if exists
    assets_path = os.path.join(frontend_dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    # Catch-all route to serve SPA index.html for React Router
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api/") or full_path == "health":
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        file_path = os.path.join(frontend_dist_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
else:
    @app.get("/")
    def root_placeholder():
        return {
            "app": "HandoverTrail API",
            "status": "running",
            "health": "/health",
            "docs": "/api/docs",
            "note": "Frontend not yet built. Run 'make build' or start Vite dev server on port 5173.",
        }
