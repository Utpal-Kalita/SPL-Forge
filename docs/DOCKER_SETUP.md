# Docker Setup Guide for SPL Forge

This guide explains how to use Docker to set up complete SPL Forge development environment with Splunk, eliminating platform-specific installation complexity and making local development reproducible.

## Why Use Docker for SPL Forge

### Benefits

- Reproducibility: same environment across developers and CI pipelines
- Isolation: Splunk runs in container, no host-level installation needed
- Easy reset: remove containers and volumes to start fresh
- Cross-platform: works on Linux, macOS, and Windows with Docker
- Resource control: limit memory and CPU usage
- Persistence: named volumes keep data between restarts
- Demo-safe: pre-configured local scenarios without touching host setup

### When to Use Docker

- Local development and testing
- CI and validation workflows
- Demo preparation and walkthroughs
- Team onboarding
- Temporary Splunk instances for integration testing
- Isolated experiments without side effects

### When Not to Use Docker

- Production deployments
- Long-term enterprise Splunk instances
- Full Splunk clustering or distributed search topologies

## Prerequisites

### Required

- Docker 20.10+ recommended
  - [Docker Desktop](https://www.docker.com/products/docker-desktop)
  - [Docker Engine](https://docs.docker.com/engine/install/) for Linux
- Docker Compose
  - Included with Docker Desktop
  - Needed for included `docker-compose.yml`

### Verify Installation

```bash
docker --version
docker ps
```

Expected:

```text
Docker version 20.10.x or higher
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

## Quick Start: Docker + Splunk Enterprise

### Option 1: Single `docker run` Command

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

What this does:

| Flag | Purpose |
| --- | --- |
| `-d` | Run in background |
| `--name splunk-spl-forge` | Stable container name |
| `-p 8000:8000` | Splunk Web UI |
| `-p 8089:8089` | Splunk management API |
| `-e SPLUNK_PASSWORD=...` | Sets admin password |
| `-e SPLUNK_START_ARGS='--accept-license'` | Accepts Splunk license |
| `-v splunk-data:/opt/splunk/var` | Persists indexed data |
| `splunk/splunk:latest` | Official Splunk image |

### Option 2: Docker Compose

Use included `docker-compose.yml`:

```bash
docker-compose up -d
docker-compose logs -f splunk
docker-compose down
docker-compose down -v
```

## Splunk Initialization and Access

### 1. Wait for Splunk to Be Ready

```bash
docker logs splunk-spl-forge
```

Wait for message:

```text
Splunk has finished initializing and is ready to accept logins
```

First startup usually takes 2 to 3 minutes.

### 2. Access Splunk Web UI

Open:

```text
http://localhost:8000
```

Credentials:

- Username: `admin`
- Password: `SplunkDemo123!`

### 3. Verify API Connectivity

```bash
curl -k -u admin:SplunkDemo123! \
  https://localhost:8089/services/server/info
```

Expected response includes Splunk version and server information.

## Loading Demo Data into Docker Splunk

### Option A: Upload via Web UI

1. Open `http://localhost:8000`
2. Go to `Settings -> Data Inputs -> Add Data`
3. Choose `Upload Files`
4. Select CSV or log file
5. Set `sourcetype=auth`
6. Set `index=main`
7. Submit import

### Option B: Copy File into Container

```bash
docker cp /path/to/sample_logs.csv splunk-spl-forge:/tmp/sample_logs.csv

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

Upload with either method above.

## Verification Queries

Run in Splunk search UI after data load:

### Basic Search

```spl
index=main sourcetype=auth | head 10
```

### Count Failed Logins

```spl
index=main sourcetype=auth action=failure | stats count
```

### Failed Logins by Country

```spl
index=main sourcetype=auth action=failure | stats count by country
```

### Top Users with Failures

```spl
index=main sourcetype=auth action=failure | top user
```

## Environment Variables for SPL Forge

Copy example file:

```bash
cp .env.example .env.local
```

Recommended `.env.local` values:

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

Ensure `.env.local` stays ignored by git.

## Docker Management Commands

### View Running Containers

```bash
docker ps
docker ps -a
```

### View Logs

```bash
docker logs -f splunk-spl-forge
docker logs --tail 100 splunk-spl-forge
docker logs --since 2h splunk-spl-forge
```

### Stop, Start, Restart

```bash
docker stop splunk-spl-forge
docker start splunk-spl-forge
docker restart splunk-spl-forge
```

### Remove Container

```bash
docker stop splunk-spl-forge
docker rm splunk-spl-forge
```

This removes container but keeps named volumes.

### Full Reset

```bash
docker stop splunk-spl-forge
docker rm splunk-spl-forge
docker volume rm splunk-data splunk-etc
```

Or prune unused volumes:

```bash
docker volume prune
```

### Access Container Shell

```bash
docker exec -it splunk-spl-forge /bin/bash
```

Useful commands inside container:

```bash
cat /opt/splunk/etc/splunk-launch.conf
/opt/splunk/bin/splunk list index -auth admin:SplunkDemo123!
/opt/splunk/bin/splunk search "index=main | head 5" -auth admin:SplunkDemo123!
```

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
| --- | --- |
| `--memory 4g` | Limit container RAM to 4 GB |
| `--cpus 2.0` | Limit container CPU to 2 cores |

### Monitor Resource Usage

```bash
docker stats splunk-spl-forge
```

## Integration with VS Code Extension Development

Recommended workflow:

- Terminal 1: `npm run watch`
- Terminal 2: `docker logs -f splunk-spl-forge`
- Terminal 3: `npm run lint` or `npm test`
- VS Code: press `F5` to launch Extension Development Host

Extension can then:

- Read values from `.env.local`
- Make REST calls to `https://localhost:8089`
- Execute sample SPL queries
- Capture responses during development

## Troubleshooting Docker Setup

### Splunk Container Does Not Start

Check logs:

```bash
docker logs splunk-spl-forge
```

Common causes:

- Port `8000` or `8089` already in use
- Not enough disk space
- Docker daemon not running

### Cannot Reach `http://localhost:8000`

```bash
docker ps | grep splunk-spl-forge
docker start splunk-spl-forge
docker logs splunk-spl-forge | tail -5
```

### Reset Splunk Password

```bash
docker exec splunk-spl-forge /opt/splunk/bin/splunk reset admin-passphrase \
  -auth admin:SplunkDemo123! \
  -password NewPassword123!
```

### Volume Problems

```bash
docker volume ls | grep splunk-data
docker volume inspect splunk-data
docker volume rm splunk-data
```

Then recreate with `docker-compose up -d`.

### SSL Certificate Warning

Splunk uses self-signed certificates by default in Docker. For local development, set:

```bash
SPLUNK_VERIFY_SSL=false
```

Use proper certificates in production.

## CI Integration

Example GitHub Actions job:

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
          --health-cmd "curl -f -k https://localhost:8089/services/server/info || exit 1"
          --health-interval 30s
          --health-timeout 10s
          --health-retries 5
        ports:
          - 8000:8000
          - 8089:8089

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm install

      - name: Run tests
        env:
          SPLUNK_HOST: https://localhost:8089
          SPLUNK_USERNAME: admin
          SPLUNK_PASSWORD: TestPassword123!
        run: npm test
```

## Switching Between Docker and Non-Docker Splunk

Example `.env.local` values:

```bash
# Docker Splunk
SPL_FORGE_SPLUNK_SOURCE=docker
SPLUNK_HOST=https://localhost:8089

# Local or cloud Splunk
SPL_FORGE_SPLUNK_SOURCE=local
SPLUNK_HOST=https://your-splunk-host:8089
```

Example code:

```ts
const splunkHost = process.env.SPLUNK_HOST;
const splunkMode = process.env.SPL_FORGE_SPLUNK_SOURCE || "docker";
```

## Advanced: Custom Splunk Docker Image

Example `Dockerfile.splunk`:

```dockerfile
FROM splunk/splunk:latest

ENV SPLUNK_PASSWORD=SplunkDemo123!
ENV SPLUNK_START_ARGS=--accept-license

COPY ./splunk-apps/ /opt/splunk/etc/apps/
COPY ./sample_data/ /tmp/sample_data/
COPY ./scripts/init-splunk.sh /

RUN chmod +x /init-splunk.sh
RUN /init-splunk.sh

EXPOSE 8000 8089
```

Build custom image:

```bash
docker build -t spl-forge/splunk:latest -f Dockerfile.splunk .
```

Then update `docker-compose.yml` to use:

```yaml
services:
  splunk:
    image: spl-forge/splunk:latest
```

## Best Practices

Do:

- Use `.env.local` for sensitive credentials
- Set resource limits
- Use named volumes for persistence
- Document custom Docker additions
- Test against Docker Splunk before pushing
- Use Docker Compose for team consistency

Do not:

- Commit `.env.local` or passwords
- Run Splunk without resource limits
- Use `latest` in production
- Store important data only inside container filesystem
- Assume Docker setup is production deployment pattern

## Next Steps

1. Start Docker environment with quick start commands.
2. Load demo data with one of methods above.
3. Verify queries in Splunk UI.
4. Create `.env.local` from `.env.example`.
5. Run `npm run watch` and launch VS Code host with `F5`.

## Related Documentation

- [`QUICKSTART.md`](./QUICKSTART.md)
- [`SPLUNK_SETUP.md`](./SPLUNK_SETUP.md)
- [`VS_CODE_SETUP.md`](./VS_CODE_SETUP.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`DEMO_RUNBOOK.md`](./DEMO_RUNBOOK.md)
