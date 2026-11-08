import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from app.config import settings
from app.db import init_db, SessionLocal
from app.fixtures.seed_data import seed_database
from app.models import Project

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
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite tables
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


# Static File Serving & Single-Service SPA Routing
frontend_dist_path = os.path.abspath(settings.FRONTEND_DIR)
if not os.path.isabs(settings.FRONTEND_DIR):
    frontend_dist_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", settings.FRONTEND_DIR)
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

