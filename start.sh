#!/bin/bash

echo "=============================================="
echo "  🐟 AI Fisheries & Aquaculture Manager"
echo "  Starting Application..."
echo "=============================================="

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Load .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-4001}
FRONTEND_PORT=${FRONTEND_PORT:-3001}

# ========== Clean up used ports ==========
echo -e "${YELLOW}[1/6] Cleaning up ports $BACKEND_PORT and $FRONTEND_PORT...${NC}"
cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo -e "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null
    sleep 1
  fi
}
cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT
echo -e "${GREEN}  ✓ Ports cleaned${NC}"

# ========== Check PostgreSQL ==========
echo -e "${YELLOW}[2/6] Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}  ✗ PostgreSQL not found. Please install PostgreSQL.${NC}"
  exit 1
fi

# Try to create database if it doesn't exist
psql -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-fisheries_manager}'" 2>/dev/null | grep -q 1 || \
  createdb -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} ${DB_NAME:-fisheries_manager} 2>/dev/null

if psql -U ${DB_USER:-postgres} -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -d ${DB_NAME:-fisheries_manager} -c "SELECT 1" &>/dev/null; then
  echo -e "${GREEN}  ✓ PostgreSQL is running and database exists${NC}"
else
  echo -e "${RED}  ✗ Cannot connect to PostgreSQL. Make sure it's running.${NC}"
  echo -e "${RED}    Try: brew services start postgresql${NC}"
  exit 1
fi

# ========== Install dependencies ==========
echo -e "${YELLOW}[3/6] Installing dependencies...${NC}"

cd "$PROJECT_DIR/server"
if [ ! -d "node_modules" ]; then
  echo -e "  Installing server dependencies..."
  npm install --silent 2>&1 | tail -1
else
  echo -e "  Server dependencies already installed"
fi

cd "$PROJECT_DIR/client"
if [ ! -d "node_modules" ]; then
  echo -e "  Installing client dependencies..."
  npm install --silent 2>&1 | tail -1
else
  echo -e "  Client dependencies already installed"
fi

cd "$PROJECT_DIR"
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# ========== Seed Database ==========
echo -e "${YELLOW}[4/6] Seeding database...${NC}"
cd "$PROJECT_DIR/server"
node seeds/seed.js
if [ $? -eq 0 ]; then
  echo -e "${GREEN}  ✓ Database seeded successfully${NC}"
else
  echo -e "${RED}  ✗ Database seeding failed${NC}"
  exit 1
fi

# ========== Start Backend with auto-reload ==========
echo -e "${YELLOW}[5/6] Starting backend server on port $BACKEND_PORT...${NC}"
cd "$PROJECT_DIR/server"

# Use npx nodemon for auto-reload if available, otherwise node with watch
if npx --yes nodemon --version &>/dev/null 2>&1; then
  npx nodemon index.js &
else
  node --watch index.js &
fi
BACKEND_PID=$!
echo -e "${GREEN}  ✓ Backend starting (PID: $BACKEND_PID)${NC}"

# Wait for backend to be ready
echo -e "  Waiting for backend..."
for i in {1..30}; do
  if curl -s http://localhost:$BACKEND_PORT/api/health &>/dev/null; then
    echo -e "${GREEN}  ✓ Backend is ready!${NC}"
    break
  fi
  sleep 1
done

# ========== Start Frontend with auto-reload ==========
echo -e "${YELLOW}[6/6] Starting frontend on port $FRONTEND_PORT...${NC}"
cd "$PROJECT_DIR/client"
BROWSER=none PORT=$FRONTEND_PORT npm start &
FRONTEND_PID=$!
echo -e "${GREEN}  ✓ Frontend starting (PID: $FRONTEND_PID)${NC}"

# ========== Summary ==========
sleep 3
echo ""
echo "=============================================="
echo -e "${GREEN}  🐟 Application is running!${NC}"
echo "=============================================="
echo -e "  ${BLUE}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
echo -e "  ${BLUE}Backend:${NC}   http://localhost:$BACKEND_PORT"
echo -e "  ${BLUE}API Health:${NC} http://localhost:$BACKEND_PORT/api/health"
echo ""
echo -e "  ${YELLOW}Login Credentials:${NC}"
echo -e "    Email:    admin@fisheries.com"
echo -e "    Password: admin123"
echo ""
echo -e "  ${YELLOW}Or click 'Quick Login' on the login page${NC}"
echo ""
echo -e "  ${RED}Press Ctrl+C to stop all services${NC}"
echo "=============================================="

# Trap Ctrl+C to kill both processes
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  echo -e "${GREEN}✓ All services stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
