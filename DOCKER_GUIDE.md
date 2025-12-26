# 🐳 Docker Containerization Guide

## E-Commerce CLI Application

This guide provides complete instructions for containerizing and running the E-Commerce application using Docker.

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Project Structure](#-project-structure)
3. [Dockerfile Explanation](#-dockerfile-explanation)
4. [Docker Compose Explanation](#-docker-compose-explanation)
5. [Build Commands](#-build-commands)
6. [Run Commands](#-run-commands)
7. [Useful Docker Commands](#-useful-docker-commands)
8. [Verifying Database](#-verifying-database)
9. [Troubleshooting](#-troubleshooting)

---

## 🔧 Prerequisites

### Install Docker Desktop

**For Windows:**
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer
3. Restart your computer if prompted
4. Open Docker Desktop and wait for it to start
5. Verify installation:
   ```cmd
   docker --version
   docker-compose --version
   ```

**For macOS:**
```bash
brew install --cask docker
# Then open Docker Desktop from Applications
```

**For Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# Log out and log back in
```

---

## 📁 Project Structure

```
ecommerce4-Updated/
├── Dockerfile                    # Application container definition
├── docker-compose.yml            # Multi-container orchestration
├── .dockerignore                 # Files to exclude from build
├── docker/
│   └── init-db/
│       └── 01-init-data.sql     # Database initialization script
├── pom.xml                       # Maven configuration
├── src/
│   └── main/
│       ├── java/                 # Java source code
│       └── resources/
│           └── application.properties
└── target/                       # Build output (generated)
```

---

## 📄 Dockerfile Explanation

The Dockerfile uses a **multi-stage build** for efficiency:

```dockerfile
# ============================================
# STAGE 1: BUILD STAGE
# ============================================
FROM maven:3.9.6-eclipse-temurin-17 AS builder
```

| Instruction | Description |
|-------------|-------------|
| `FROM maven:3.9.6-eclipse-temurin-17 AS builder` | Uses Maven with JDK 17 as base image for building |
| `WORKDIR /app` | Sets working directory inside container |
| `COPY pom.xml .` | Copies Maven config (cached layer) |
| `RUN mvn dependency:go-offline` | Downloads dependencies (cached if pom.xml unchanged) |
| `COPY src ./src` | Copies source code |
| `RUN mvn clean package -DskipTests` | Builds the JAR file |

```dockerfile
# ============================================
# STAGE 2: RUNTIME STAGE
# ============================================
FROM eclipse-temurin:17-jre-alpine
```

| Instruction | Description |
|-------------|-------------|
| `FROM eclipse-temurin:17-jre-alpine` | Lightweight JRE image (~180MB vs ~500MB) |
| `LABEL` | Adds metadata to image |
| `RUN addgroup/adduser` | Creates non-root user for security |
| `COPY --from=builder` | Copies JAR from build stage |
| `USER appuser` | Runs as non-root user |
| `EXPOSE 8080` | Documents exposed port |
| `HEALTHCHECK` | Monitors container health |
| `ENTRYPOINT` | Command to run when container starts |

---

## 📄 Docker Compose Explanation

### Services Overview

```yaml
services:
  postgres:      # PostgreSQL database
  ecommerce-app: # Spring Boot application
  pgadmin:       # Database management GUI (optional)
```

### PostgreSQL Service

| Configuration | Value | Description |
|---------------|-------|-------------|
| `image` | `postgres:15-alpine` | Official PostgreSQL 15 image |
| `container_name` | `ecommerce-postgres` | Easy reference name |
| `POSTGRES_DB` | `e_com` | Database name |
| `POSTGRES_USER` | `postgres` | Database username |
| `POSTGRES_PASSWORD` | `sherupass` | Database password |
| `ports` | `5432:5432` | Host:Container port mapping |
| `volumes` | `postgres_data` | Persistent data storage |
| `healthcheck` | `pg_isready` | Ensures DB is ready |

### Application Service

| Configuration | Value | Description |
|---------------|-------|-------------|
| `build.context` | `.` | Build from current directory |
| `build.dockerfile` | `Dockerfile` | Use our Dockerfile |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://postgres:5432/e_com` | DB connection (uses service name) |
| `depends_on` | `postgres: condition: service_healthy` | Wait for DB to be ready |
| `stdin_open: true` | - | Enable interactive input for CLI |
| `tty: true` | - | Allocate terminal for CLI |

### PgAdmin Service (Optional)

| Configuration | Value | Description |
|---------------|-------|-------------|
| `image` | `dpage/pgadmin4` | Web-based DB admin tool |
| `ports` | `5050:80` | Access at http://localhost:5050 |
| `PGADMIN_DEFAULT_EMAIL` | `admin@admin.com` | Login email |
| `PGADMIN_DEFAULT_PASSWORD` | `admin123` | Login password |

---

## 🔨 Build Commands

### Step 1: Open Terminal/Command Prompt

Navigate to project directory:

```cmd
cd C:\path\to\ecommerce4-Updated
```
or
```bash
cd /path/to/ecommerce4-Updated
```

### Step 2: Build Docker Images

**Build all services:**
```bash
docker-compose build
```

**Build with no cache (fresh build):**
```bash
docker-compose build --no-cache
```

**Build only the application:**
```bash
docker build -t ecommerce-app:latest .
```

### Expected Output:

```
[+] Building 120.5s (15/15) FINISHED
 => [builder 1/6] FROM maven:3.9.6-eclipse-temurin-17
 => [builder 2/6] WORKDIR /app
 => [builder 3/6] COPY pom.xml .
 => [builder 4/6] RUN mvn dependency:go-offline -B
 => [builder 5/6] COPY src ./src
 => [builder 6/6] RUN mvn clean package -DskipTests
 => [stage-1 1/5] FROM eclipse-temurin:17-jre-alpine
 => [stage-1 2/5] WORKDIR /app
 => [stage-1 3/5] RUN addgroup -S appgroup && adduser -S appuser
 => [stage-1 4/5] COPY --from=builder /app/target/*.jar app.jar
 => exporting to image
 => => naming to docker.io/library/ecommerce-app:latest
```

---

## ▶️ Run Commands

### Option 1: Run All Services (Recommended)

**Start all containers:**
```bash
docker-compose up
```

**Start in detached mode (background):**
```bash
docker-compose up -d
```

**Start and rebuild:**
```bash
docker-compose up --build
```

### Option 2: Run Services Separately

**Start only PostgreSQL:**
```bash
docker-compose up -d postgres
```

**Start only the application:**
```bash
docker-compose up ecommerce-app
```

### Option 3: Run with Interactive CLI

Since this is a CLI application, run it interactively:

```bash
docker-compose run --rm ecommerce-app
```

Or attach to running container:

```bash
docker attach ecommerce-app
```

### Stop Commands

**Stop all containers:**
```bash
docker-compose down
```

**Stop and remove volumes (deletes data):**
```bash
docker-compose down -v
```

**Stop specific service:**
```bash
docker-compose stop ecommerce-app
```

---

## 🔧 Useful Docker Commands

### Container Management

| Command | Description |
|---------|-------------|
| `docker ps` | List running containers |
| `docker ps -a` | List all containers |
| `docker logs ecommerce-app` | View application logs |
| `docker logs -f ecommerce-app` | Follow logs in real-time |
| `docker exec -it ecommerce-app sh` | Open shell in container |
| `docker restart ecommerce-app` | Restart container |

### Image Management

| Command | Description |
|---------|-------------|
| `docker images` | List all images |
| `docker rmi ecommerce-app` | Remove image |
| `docker image prune` | Remove unused images |

### Network & Volume

| Command | Description |
|---------|-------------|
| `docker network ls` | List networks |
| `docker volume ls` | List volumes |
| `docker volume rm ecommerce-postgres-data` | Remove volume |

### Cleanup Commands

```bash
# Remove all stopped containers
docker container prune

# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove everything (careful!)
docker system prune -a --volumes
```

---

## 🗄️ Verifying Database

### Method 1: Using PgAdmin (GUI)

1. Open browser: http://localhost:5050
2. Login:
   - Email: `admin@admin.com`
   - Password: `admin123`
3. Add New Server:
   - Name: `E-Commerce`
   - Host: `postgres` (service name)
   - Port: `5432`
   - Database: `e_com`
   - Username: `postgres`
   - Password: `sherupass`

### Method 2: Using psql in Container

```bash
# Connect to PostgreSQL container
docker exec -it ecommerce-postgres psql -U postgres -d e_com

# Run SQL commands
\dt                          -- List tables
SELECT * FROM user_table;    -- View users
SELECT * FROM product_table; -- View products
SELECT * FROM orders;        -- View orders
\q                           -- Exit
```

### Method 3: Using Local psql

```bash
psql -h localhost -p 5432 -U postgres -d e_com
```

---

## 📸 Screenshots Checklist

For your documentation, capture screenshots of:

### 1. Dockerfile Contents
- [ ] Screenshot of Dockerfile in code editor

### 2. docker-compose.yml Contents
- [ ] Screenshot of docker-compose.yml in code editor

### 3. Build Process
- [ ] `docker-compose build` command and output

### 4. Running Containers
- [ ] `docker-compose up` command and output
- [ ] `docker ps` showing running containers

### 5. Application Running
- [ ] CLI menu displayed in terminal

### 6. Database Verification
- [ ] PgAdmin interface showing tables
- [ ] Or psql commands showing data

---

## ❗ Troubleshooting

### Error: "Cannot connect to Docker daemon"

**Solution (Windows):**
- Make sure Docker Desktop is running
- Look for Docker icon in system tray

**Solution (Linux):**
```bash
sudo systemctl start docker
```

### Error: "Port 5432 already in use"

**Solution:**
```bash
# Find process using port
netstat -ano | findstr :5432  # Windows
lsof -i :5432                  # macOS/Linux

# Stop local PostgreSQL or change port in docker-compose.yml
ports:
  - "5433:5432"  # Use 5433 on host
```

### Error: "Database does not exist"

**Solution:**
Wait for PostgreSQL to initialize. Check logs:
```bash
docker logs ecommerce-postgres
```

### Error: "Connection refused"

**Solution:**
The app started before database was ready. Restart:
```bash
docker-compose restart ecommerce-app
```

### Error: "Out of memory"

**Solution:**
Increase Docker Desktop memory:
1. Docker Desktop → Settings → Resources
2. Increase Memory to 4GB or more

### Container Exits Immediately

**Solution:**
For CLI apps, use interactive mode:
```bash
docker-compose run --rm ecommerce-app
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Host                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              ecommerce-network (bridge)              │   │
│  │                                                      │   │
│  │  ┌──────────────┐    ┌──────────────┐    ┌────────┐│   │
│  │  │  ecommerce-  │    │  ecommerce-  │    │pgadmin ││   │
│  │  │     app      │───▶│   postgres   │◀───│  :5050 ││   │
│  │  │    :8080     │    │    :5432     │    │        ││   │
│  │  └──────────────┘    └──────────────┘    └────────┘│   │
│  │         │                   │                       │   │
│  └─────────┼───────────────────┼───────────────────────┘   │
│            │                   │                            │
│       Port 8080           Port 5432                         │
│            │                   │                            │
└────────────┼───────────────────┼────────────────────────────┘
             │                   │
        ┌────▼────┐         ┌────▼────┐
        │  Host   │         │  Host   │
        │ :8080   │         │ :5432   │
        └─────────┘         └─────────┘
```

---

## 🎯 Quick Start Summary

```bash
# 1. Navigate to project
cd /path/to/ecommerce4-Updated

# 2. Build images
docker-compose build

# 3. Start services
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Run CLI interactively
docker-compose run --rm ecommerce-app

# 6. Access PgAdmin
# Open http://localhost:5050

# 7. Stop everything
docker-compose down
```

---

*Last Updated: December 2024*

