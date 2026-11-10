.PHONY: setup dev run build test seed clean help

PYTHON ?= python3.12
PORT ?= 8080

help:
	@echo "HandoverTrail Makefile Targets:"
	@echo "  make setup   - Set up backend virtualenv and install npm dependencies"
	@echo "  make dev     - Run backend (FastAPI) and frontend (Vite) concurrently"
	@echo "  make run     - Run backend server with uvicorn"
	@echo "  make build   - Build frontend static assets into frontend/dist"
	@echo "  make test    - Run backend pytest test suite"
	@echo "  make seed    - Seed SQLite database with synthetic CampusConnect dataset"
	@echo "  make clean   - Remove build artifacts, cache, and virtual environment"

setup:
	@echo "==> Setting up backend virtual environment with $(PYTHON)..."
	cd backend && $(PYTHON) -m venv venv && ./venv/bin/pip install --upgrade pip && ./venv/bin/pip install -r requirements.txt
	@echo "==> Installing frontend dependencies..."
	cd frontend && npm install
	@echo "==> Setup complete!"

dev:
	@echo "==> Starting backend and frontend dev servers on port $(PORT) and 5173..."
	@which npx >/dev/null 2>&1 || (echo "npx is required for dev server" && exit 1)
	npx concurrently -k -n "backend,frontend" -c "blue,magenta" \
		"cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $(PORT) --reload" \
		"cd frontend && BACKEND_PORT=$(PORT) npm run dev"

run:
	@echo "==> Running backend server on port $(PORT)..."
	cd backend && ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port $(PORT)

build:
	@echo "==> Building frontend distribution..."
	cd frontend && npm run build
	@echo "==> Frontend built to frontend/dist!"

test:
	@echo "==> Running backend test suite..."
	cd backend && ./venv/bin/pytest -v tests/

seed:
	@echo "==> Seeding database with synthetic CampusConnect dataset..."
	cd backend && ./venv/bin/python -c "from app.db import SessionLocal, init_db; from app.fixtures.seed_data import seed_database; init_db(); db = SessionLocal(); print(seed_database(db, force_reset=True)); db.close()"
	@echo "==> Database seeded successfully!"

clean:
	rm -rf backend/venv backend/.pytest_cache backend/__pycache__ backend/app/__pycache__ backend/app/*/__pycache__
	rm -rf frontend/node_modules frontend/dist frontend/.vite
	rm -f backend/handovertrail.db test_handovertrail.db
