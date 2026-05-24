# Docker Setup Guide for SPL Forge

This guide explains how to use Docker to set up a complete SPL Forge development environment with Splunk, eliminating platform-specific installation complexities and ensuring reproducible local development.

---

## Why Use Docker for SPL Forge

### Benefits

- **Reproducibility**: Same environment across all developers and CI/CD pipelines
- **Isolation**: Splunk runs in a container, no system-level installation needed
- **Easy Reset**: Stop and remove containers to start fresh
- **Cross-Platform**: Works on Linux, macOS, and Windows with Docker Desktop
- **Resource Control**: Set memory and CPU limits to manage system load
- **Persistence**: Use volumes to keep data between container restarts
- **Demo-Safe**: Pre-configured demo scenarios without affecting host system

### When to Use Docker

- ✅ Local development and testing
- ✅ Running CI/CD workflows
- ✅ Demo preparation and walkthroughs
- ✅ Team onboarding (consistent environments)
- ✅ Temporary Splunk instances for integration testing
- ✅ Isolated experiments without side effects

### When NOT to Use Docker

- ❌ Production deployments (use official Splunk deployment patterns)
- ❌ Long-term enterprise Splunk instances (use dedicated infrastructure)
- ❌ When you need full Splunk clustering or distributed search

---

## Prerequisites

### Required

- **Docker** — version 20.10+ recommended
  - [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - [Docker Engine](https://docs.docker.com/engine/install/) (Linux)

- **Docker Compose** (optional, included with Docker Desktop)
  - Simplifies multi-container orchestration if needed in future

### Verify Installation

```bash
docker --version
docker ps
```

Should output:
```
Docker version 20.10.x or higher
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
(empty if no containers running)
```

---

## Quick Start: Docker + Splunk Enterprise

### Option 1: Single `docker run` Command (Fastest)

```bash
docker run -d \
  --name splunk-spl-forge \
  -p 8000:8000 \
  -p 8089:8089 \
  -e SPLUNK_PASSWORD=SplunkDemo123! \
  -e SPLUNK_START_ARGS='--accept-license' \
  -v splunk-data:/opt/splunk/var \
  splunk/splunk:latest
```

**What this does:**

| Flag | Purpose |
|------|---------|
| `-d` | Run in background (detached mode) |
| `--name splunk-spl-forge` | Container name for easy reference |
| `-p 8000:8000` | Web UI access (http://localhost:8000) |
| `-p 8089:8089` | Management port for API (https://localhost:8089) |
| `-e SPLUNK_PASSWORD=...` | Admin password (change to your preference) |
| `-e SPLUNK_START_ARGS='--accept-license'` | Accept license automatically |
| `-v splunk-data:/opt/splunk/var` | Persistent volume for data |
| `splunk/splunk:latest` | Splunk official Docker image |

### Option 2: Docker Compose (Recommended for Teams)

Use the included `docker-compose.yml`:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f splunk

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Splunk Initialization & Access

### 1. Wait for Splunk to Be Ready

```bash
# View startup logs
docker logs splunk-spl-forge

# Wait until you see:
# "Splunk has finished initializing and is ready to accept logins"
```

This typically takes **2-3 minutes** on first startup.

### 2. Access Splunk Web UI

Open in browser:
```
http://localhost:8000
```

Login credentials:
- **Username**: `admin`
- **Password**: `SplunkDemo123!` (or your chosen password)

### 3. Verify API Connectivity

```bash
# Test management port (requires accepting self-signed certificate)
curl -k -u admin:SplunkDemo123! \
  https://localhost:8089/services/server/info
```

Expected response includes Splunk version and instance info.

---

## Loading Demo Data into Docker Splunk

### Option A: Upload via Web UI (Easiest)

1. Navigate to `http://localhost:8000`
2. Click **Settings** → **Data Inputs** → **Add Data**
3. Choose **Upload Files**
4. Select your CSV or log file
5. Set `sourcetype` to `auth` (for failed-login scenario)
6. Set `index` to `main`
7. Click **Review** → **Submit**

### Option B: Copy Files into Container

```bash
# Copy file into container
docker cp /path/to/sample_logs.csv splunk-spl-forge:/tmp/sample_logs.csv

# Execute upload inside container
docker exec splunk-spl-forge /opt/splunk/bin/splunk add oneshot \
  /tmp/sample_logs.csv \
  -sourcetype auth \
  -index main \
  -auth admin:SplunkDemo123!
```

### Option C: Sample Failed-Login Data

Create `sample_auth_logs.csv`:

```csv
timestamp,user,src,country,user_agent,action,sourcetype,index
2026-05-24T10:15:23Z,jdoe,192.168.1.100,US,Mozilla/5.0,failure,auth,main
2026-05-24T10:16:45Z,msmith,203.45.67.89,India,Mozilla/5.0,failure,auth,main
2026-05-24T10:17:12Z,kchen,150.23.45.67,China,Chrome/91.0,failure,auth,main
2026-05-24T10:18:03Z,jdoe,192.168.1.100,US,Safari/14.0,success,auth,main
2026-05-24T10:19:27Z,agarcia,45.67.89.123,Brazil,Firefox/89.0,failure,auth,main
```

Upload via one of the above methods.

---

## Environment Variables for SPL Forge Extension

Create `.env.local` in repository root (do NOT commit):

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
```

Or manually create `.env.local`:

```bash
SPLUNK_HOST=https://localhost:8089
SPLUNK_USERNAME=admin
SPLUNK_PASSWORD=SplunkDemo123!
SPLUNK_INDEX=main
SPLUNK_VERIFY_SSL=false
SPL_FORGE_ENV=development
SPL_FORGE_SPLUNK_MODE=rest
SPL_FORGE_SPLUNK_SOURCE=docker
```

Add to `.gitignore`:

```bash
echo ".env.local" >> .gitignore
```

---

## Docker Management Commands

### View Running Containers

```bash
docker ps
docker ps -a  # Include stopped containers
```

### View Container Logs

```bash
# Real-time logs
docker logs -f splunk-spl-forge

# Last 100 lines
docker logs --tail 100 splunk-spl-forge

# Logs since specific time
docker logs --since 2h splunk-spl-forge
```

### Stop Container

```bash
docker stop splunk-spl-forge
```

Container persists on disk; restart later with `docker start`.

### Start Container

```bash
docker start splunk-spl-forge
```

### Restart Container

```bash
docker restart splunk-spl-forge
```

### Remove Container (Cleanup)

```bash
# Stop first
docker stop splunk-spl-forge

# Remove container
docker rm splunk-spl-forge
```

**⚠️ Warning:** Removes container but keeps volume. Data persists.

### Remove Container + Data (Full Reset)

```bash
# Stop and remove container
docker stop splunk-spl-forge && docker rm splunk-spl-forge

# Remove volume
docker volume rm splunk-data

# OR remove all unused volumes
docker volume prune
```

### Access Container Shell

```bash
docker exec -it splunk-spl-forge /bin/bash
```

Once inside:
```bash
# View Splunk config
cat /opt/splunk/etc/splunk-launch.conf

# Check indexes
/opt/splunk/bin/splunk list index -auth admin:SplunkDemo123!

# View index data
/opt/splunk/bin/splunk search "index=main | head 5" -auth admin:SplunkDemo123!
```

---

## Resource Management

### Set Memory and CPU Limits

```bash
docker run -d \
  --name splunk-spl-forge \
  --memory 4g \
  --cpus 2.0 \
  -p 8000:8000 \
  -p 8089:8089 \
  -e SPLUNK_PASSWORD=SplunkDemo123! \
  -e SPLUNK_START_ARGS='--accept-license' \
  -v splunk-data:/opt/splunk/var \
  splunk/splunk:latest
```

| Flag | Meaning |
|------|---------|
| `--memory 4g` | Max 4GB RAM for Splunk container |
| `--cpus 2.0` | Max 2 CPU cores for Splunk container |

### Monitor Resource Usage

```bash
docker stats splunk-spl-forge
```

Shows real-time CPU, memory, network I/O, and block I/O.

---

## Integration with VS Code Extension Development

### Workflow

1. **Terminal 1**: Watch extension code
   ```bash
   npm run watch
   ```

2. **Terminal 2**: Monitor Splunk logs
   ```bash
   docker logs -f splunk-spl-forge
   ```

3. **Terminal 3**: Run tests or lint
   ```bash
   npm run lint
   npm test
   ```

4. **VS Code**: Press F5 to launch Extension Development Host

### Testing Extension with Docker Splunk

The extension can test Splunk connectivity by:

1. Reading environment variables (`.env.local`)
2. Making API calls to `https://localhost:8089`
3. Executing sample SPL queries
4. Capturing results in real-time

---

## Verification Queries

Once data is loaded, test with these SPL queries in Splunk UI:

### 1. Basic Search
```spl
index=main sourcetype=auth | head 10
```

### 2. Count Failed Logins
```spl
index=main sourcetype=auth action=failure | stats count
```

### 3. Failed Logins by Country
```spl
index=main sourcetype=auth action=failure | stats count by country
```

### 4. Top Users with Failures
```spl
index=main sourcetype=auth action=failure | top user
```

---

## Troubleshooting Docker Setup

### Splunk Container Won't Start

```bash
# Check logs
docker logs splunk-spl-forge

# Common issues:
# - Port 8000 or 8089 already in use
# - Insufficient disk space
# - Docker daemon not running
```

**Solution**: Stop other services using ports 8000/8089, ensure 5GB+ free disk space.

### Can't Connect to http://localhost:8000

```bash
# Check if container is running
docker ps | grep splunk-spl-forge

# If not running, start it
docker start splunk-spl-forge

# Wait 30-60 seconds for initialization
docker logs splunk-spl-forge | tail -5
```

### Splunk Password Reset

```bash
docker exec splunk-spl-forge /opt/splunk/bin/splunk reset admin-passphrase \
  -auth admin:SplunkDemo123! \
  -password NewPassword123!
```

### Data Volume Issues

```bash
# Check volume status
docker volume ls | grep splunk-data

# Inspect volume
docker volume inspect splunk-data

# Remove and recreate
docker volume rm splunk-data
# Then re-run docker run or docker-compose up
```

### SSL Certificate Warning

Splunk uses self-signed certificates by default. This is expected in Docker:

```bash
# Bypass SSL verification in .env.local
SPLUNK_VERIFY_SSL=false
```

For production, provide proper certificates.

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test SPL Forge with Docker Splunk

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      splunk:
        image: splunk/splunk:latest
        env:
          SPLUNK_PASSWORD: TestPassword123!
          SPLUNK_START_ARGS: "--accept-license"
        options: >-
          --health-cmd "curl -f https://localhost:8089/services/server/info || exit 1"
          --health-interval 30s
          --health-timeout 10s
          --health-retries 5
        ports:
          - 8000:8000
          - 8089:8089
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        env:
          SPLUNK_HOST: https://localhost:8089
          SPLUNK_USERNAME: admin
          SPLUNK_PASSWORD: TestPassword123!
        run: npm test
```

---

## Switching Between Docker and Non-Docker Splunk

### Using Environment Variable

In `.env.local`:

```bash
# Docker Splunk
SPL_FORGE_SPLUNK_SOURCE=docker
SPLUNK_HOST=https://localhost:8089

# OR local/cloud Splunk
SPL_FORGE_SPLUNK_SOURCE=local
SPLUNK_HOST=https://your-splunk-host:8089
```

### Code Example

```typescript
const splunkHost = process.env.SPLUNK_HOST;
const splunkMode = process.env.SPL_FORGE_SPLUNK_SOURCE || 'docker';

// Adapter automatically handles SSL, auth, etc.
```

---

## Advanced: Custom Splunk Docker Image

For team-specific configurations, create a custom Dockerfile:

```dockerfile
FROM splunk/splunk:latest

# Set default password
ENV SPLUNK_PASSWORD=SplunkDemo123!
ENV SPLUNK_START_ARGS=--accept-license

# Copy custom apps or configs
COPY ./splunk-apps/ /opt/splunk/etc/apps/

# Pre-load sample data
COPY ./sample_data/ /tmp/sample_data/

# Run initialization script
COPY ./scripts/init-splunk.sh /
RUN chmod +x /init-splunk.sh
RUN /init-splunk.sh

EXPOSE 8000 8089
```

Build:
```bash
docker build -t spl-forge/splunk:latest -f Dockerfile.splunk .
```

Use in `docker-compose.yml`:
```yaml
services:
  splunk:
    image: spl-forge/splunk:latest  # Your custom image
```

---

## Best Practices

### ✅ Do

- Use `.env.local` for sensitive credentials (excluded from Git)
- Set memory limits to prevent system overload
- Use named volumes for data persistence
- Document custom Docker configurations in `Dockerfile` comments
- Test against Docker Splunk before pushing to production
- Use Docker Compose for consistent team environments

### ❌ Don't

- Commit `.env.local` or passwords to Git
- Run Splunk without resource limits
- Use `latest` tag in production (pin specific versions)
- Store important data only in containers (use volumes)
- Run containers as root unnecessarily
- Assume Docker setup works for production deployments

---

## Next Steps

1. **Set up Docker** → Follow Quick Start above
2. **Load demo data** → Use Option A-C under "Loading Demo Data"
3. **Verify connectivity** → Run queries in Splunk UI
4. **Configure VS Code extension** → Create `.env.local` with Splunk credentials
5. **Test extension** → `npm run watch` + F5 in VS Code

---

## Related Documentation

- [`QUICKSTART.md`](./QUICKSTART.md) — Fastest path to demo
- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md) — Splunk setup options (including Docker)
- [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md) — VS Code extension development
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — System design and component overview
- [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md) — Demo scenario walkthrough
