# Requirements Document

## Introduction

This feature covers two related goals: (1) migrating the SkillToIncome AI backend from SQLite to PostgreSQL for local development, and (2) deploying the complete platform — Angular 20 frontend, Python FastAPI backend, PostgreSQL database, and Redis cache — to DigitalOcean in a production-ready configuration. The project already includes `asyncpg`, `psycopg2-binary`, a `docker-compose.yml` with a PostgreSQL service, and Alembic migrations, meaning the migration work is largely a matter of switching environment variables and verifying migration correctness rather than a full rewrite.

The deployment must support HTTPS, environment-specific configuration, zero-downtime database migrations, and a clear path for future CI/CD automation.

## Glossary

- **Backend**: The Python FastAPI application running on port 8000.
- **Frontend**: The Angular 20 application built and served via Nginx on port 80/443.
- **Database**: The PostgreSQL 16 instance acting as the primary data store.
- **Migration_Tool**: Alembic, the schema migration framework used by the Backend.
- **Cache**: The Redis instance used for session data and rate-limiting.
- **Droplet**: A DigitalOcean virtual private server (VPS) running Ubuntu.
- **App_Platform**: DigitalOcean's managed PaaS offering, analogous to Heroku.
- **Managed_Database**: DigitalOcean's hosted PostgreSQL service.
- **Managed_Redis**: DigitalOcean's hosted Redis service (Valkey-compatible).
- **Container_Registry**: DigitalOcean's private Docker image registry (DOCR).
- **Env_File**: A `.env` file or equivalent secrets store that holds sensitive configuration values outside of version control.
- **Reverse_Proxy**: An Nginx instance that terminates TLS and routes traffic to the Backend and Frontend.
- **CI_CD_Pipeline**: An automated workflow (GitHub Actions) that builds, tests, and deploys the application.

---

## Requirements

### Requirement 1: Local PostgreSQL Migration

**User Story:** As a developer, I want to switch the local development environment from SQLite to PostgreSQL, so that the local environment matches production and SQLite-specific quirks do not hide bugs.

#### Acceptance Criteria

1. WHEN a developer runs `docker-compose up -d`, THE Docker_Compose_Stack SHALL start the `db` (PostgreSQL 16), `redis`, `backend`, and `frontend` services; the `backend` service SHALL declare a `depends_on` health-gate so it does not start until both the `db` and `redis` services pass their health checks.
2. WHEN the `backend` service starts, THE Backend SHALL connect to the PostgreSQL `db` service using the `DATABASE_URL` environment variable set to a `postgresql+asyncpg://` connection string.
3. WHEN the `backend` service starts, THE Backend SHALL connect to Redis using the `REDIS_URL` environment variable with `USE_FAKE_REDIS` set to `false`.
4. WHEN the `backend` container starts, THE Migration_Tool SHALL run `alembic upgrade head` and apply all pending migrations to the PostgreSQL Database; this command is idempotent and runs on every container start. IF `alembic upgrade head` exits with a non-zero code, THEN the Backend process SHALL also exit with a non-zero code and the container SHALL stop.
5. IF the Database is unavailable at startup, THEN THE Backend SHALL retry the connection up to 5 times with a 2-second interval before exiting with a non-zero exit code.
6. THE Backend `.env` file for local development outside Docker SHALL set `DATABASE_URL` to `postgresql+asyncpg://postgres:<password>@localhost:5432/skilltoincome` and `DATABASE_URL_SYNC` to `postgresql://postgres:<password>@localhost:5432/skilltoincome`, where `<password>` matches the value configured in the local PostgreSQL instance.
7. WHEN a developer runs `alembic revision --autogenerate -m "<message>"`, THE Migration_Tool SHALL detect schema differences between the SQLAlchemy models and the PostgreSQL Database and generate a new migration script.
8. IF a generated migration script contains any of the following SQLite-specific constructs — PRAGMA statements, `sqlite_autoincrement`, CHECK constraints of the form `column IN (0, 1)` used to emulate booleans, or column types with no length argument that map to SQLite affinity rules — THEN the migration review process SHALL flag those constructs as requiring manual correction before the script is applied.

---

### Requirement 2: DigitalOcean Infrastructure Provisioning

**User Story:** As a developer, I want a defined DigitalOcean infrastructure topology, so that I know exactly which resources to create and what they cost before spending money.

#### Acceptance Criteria

1. THE Deployment_Architecture SHALL consist of: one Droplet (minimum 2 vCPU / 4 GB RAM, Ubuntu 22.04 LTS) running Docker + Nginx Reverse_Proxy, one Managed_Database (PostgreSQL 16, 1 vCPU / 1 GB RAM / 10 GB SSD), and one Managed_Redis (1 vCPU / 1 GB RAM).
2. THE Droplet, Managed_Database, and Managed_Redis SHALL all be provisioned in the same DigitalOcean region; the chosen region SHALL be recorded in `docs/DEPLOYMENT.md`.
3. WHEN the Droplet is provisioned, THE Droplet SHALL have a non-root `deploy` user with SSH key authentication and `sudo` privileges for running Docker commands.
4. THE Managed_Database SHALL enforce SSL/TLS for all incoming connections; any connection attempt without a valid SSL certificate SHALL be rejected by the Managed_Database.
5. THE Backend connection string SHALL include the DigitalOcean CA certificate (`sslrootcert=/path/to/ca-certificate.crt`) so that the Backend verifies the Managed_Database's identity on every connection.
6. THE Container_Registry SHALL be provisioned in the same DigitalOcean account to store Backend and Frontend Docker images.
7. WHERE a developer chooses App Platform instead of a Droplet, THE App_Platform SHALL host the Backend as a "Web Service" component and the Frontend as a "Static Site" component, with the Managed_Database configured as a database component within the App Platform application definition.

---

### Requirement 3: Environment Variable and Secrets Management

**User Story:** As a developer, I want all secrets managed outside of version control, so that credentials are never committed to the repository.

#### Acceptance Criteria

1. THE Repository SHALL contain a `.env.production.example` file listing all required production environment variables with placeholder values and inline comments, committed to version control.
2. THE Droplet deployment SHALL store production secrets in a `/etc/skilltoincome/.env.production` file readable only by the `deploy` user (file permissions `0600`).
3. WHEN the Backend container starts on the Droplet, THE Backend SHALL load environment variables from the Env_File mounted at `/etc/skilltoincome/.env.production` via a Docker `env_file` directive.
4. THE production Env_File SHALL set `DEBUG=false`, `USE_FAKE_REDIS=false`, a `SECRET_KEY` of at least 32 random characters, and `DATABASE_URL` pointing to the Managed_Database connection string with SSL enabled.
5. IF any of the required environment variables — `SECRET_KEY`, `DATABASE_URL`, `GROQ_API_KEY`, or `AI_PROVIDER` — is absent or empty at startup, THEN THE Backend SHALL log an error message that names the missing variable and exit with a non-zero exit code before accepting any requests.
6. THE production `ALLOWED_ORIGINS` SHALL be set to the production domain URL (e.g., `https://yourdomain.com`) and SHALL NOT include any `localhost` or `127.0.0.1` origins.
7. IF the Env_File at `/etc/skilltoincome/.env.production` is missing or unreadable when the Backend container starts, THEN THE Backend container SHALL exit with a non-zero exit code and log the file path that was not found.

---

### Requirement 4: Docker Image Build and Registry Push

**User Story:** As a developer, I want reproducible Docker images pushed to a private registry, so that deployments use known, versioned artifacts.

#### Acceptance Criteria

1. THE Backend Dockerfile SHALL produce a non-root image based on `python:3.12-slim` that runs as the `appuser` user, and THE image SHALL pass a `docker build` without errors.
2. THE Frontend Dockerfile SHALL use a multi-stage build: `node:20-alpine` for compilation and `nginx:alpine` for serving the compiled output, and THE image SHALL pass `docker build --build-arg API_URL=<url>` without errors.
3. WHEN an image is built, THE Build_Process SHALL tag the image with both the full 40-character git commit SHA and the `latest` tag.
4. WHEN the `docker push` command is run, THE Container_Registry SHALL accept the image and make it available for pull by the Droplet. IF the push fails, THEN the build script SHALL exit with a non-zero code and no deployment SHALL proceed.
5. THE Backend image SHALL NOT embed any `.env` file or secret values at build time; all secrets SHALL be injected at runtime via environment variables or mounted files.

---

### Requirement 5: Production Docker Compose and Nginx Configuration

**User Story:** As a developer, I want a production-specific `docker-compose.prod.yml` and Nginx configuration, so that I can deploy consistently to the Droplet with a single command.

#### Acceptance Criteria

1. THE Repository SHALL contain a `docker-compose.prod.yml` that references pre-built images from the Container_Registry instead of building from source.
2. THE `docker-compose.prod.yml` SHALL define only the `backend` and `frontend` services; it SHALL NOT define `db` or `redis` services, as those are provided by Managed_Database and Managed_Redis.
3. WHEN `docker-compose -f docker-compose.prod.yml up -d` is run on the Droplet, a `GET /health` request to the Backend on port 8000 SHALL return HTTP 200 within 30 seconds of startup.
4. WHEN `docker-compose -f docker-compose.prod.yml up -d` is run on the Droplet, a `GET /` request to the Frontend on port 3000 SHALL return HTTP 200 within 30 seconds of startup.
5. THE Reverse_Proxy Nginx configuration SHALL terminate TLS using a Let's Encrypt certificate and proxy requests with the path prefix `/api/` to the Backend (preserving the `/api/` prefix in the upstream request) and all other requests to the Frontend.
6. WHEN a Let's Encrypt certificate is renewed by Certbot, any in-flight HTTP requests being processed by the Reverse_Proxy at the time of reload SHALL complete before worker processes are recycled.
7. THE Nginx configuration SHALL set the following security headers on all responses except the ACME challenge path (`/.well-known/acme-challenge/`): `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

### Requirement 6: Database Migration in Production

**User Story:** As a developer, I want a safe, repeatable process for running database migrations in production, so that schema changes do not result in downtime or data loss.

#### Acceptance Criteria

1. WHEN a production deployment is triggered, THE Migration_Tool SHALL run `alembic upgrade head` against the Managed_Database before the new Backend version begins serving traffic.
2. THE migration step SHALL run as a one-off Docker container using the same Backend image as the deployment; it SHALL NOT run as part of the long-running Backend process.
3. IF the migration container exits with a non-zero exit code, THEN the Deployment_Process SHALL exit with a non-zero exit code and the existing Backend version SHALL continue serving traffic.
4. THE Migration_Tool SHALL connect to the Managed_Database using the SSL-enabled `DATABASE_URL_SYNC` connection string.
5. THE Managed_Database SHALL have daily automated backups enabled with a minimum 7-day retention period.
6. THE migration container SHALL be subject to a 10-minute timeout; IF the container is still running after 10 minutes, THEN the Deployment_Process SHALL terminate the container and exit with a non-zero exit code.

---

### Requirement 7: HTTPS and TLS Configuration

**User Story:** As a user, I want the application served over HTTPS, so that data in transit is encrypted and browsers do not show security warnings.

#### Acceptance Criteria

1. WHEN an HTTP request is received on port 80, THE Reverse_Proxy SHALL respond with a `301 Moved Permanently` redirect to the equivalent HTTPS URL on port 443.
2. THE TLS_Certificate SHALL be issued by Let's Encrypt using the Certbot ACME client and SHALL cover both the bare domain and the `www` subdomain.
3. WHEN a TLS_Certificate is within 30 days of expiry, THE Certbot_Renewal_Job SHALL automatically renew the certificate; the renewed certificate SHALL be deployed and active within 24 hours of renewal. IF the renewal fails, an error SHALL be logged to the system journal.
4. THE TLS configuration SHALL use TLS 1.2 and TLS 1.3 only, disabling SSLv3, TLS 1.0, and TLS 1.1.
5. THE TLS configuration SHALL achieve a grade of "A" or higher on the Qualys SSL Labs Server Test.
6. THE Reverse_Proxy SHALL include a `Strict-Transport-Security` header with a `max-age` of at least 31536000 seconds on all HTTPS responses.

---

### Requirement 8: CI/CD Pipeline (GitHub Actions)

**User Story:** As a developer, I want an automated deployment pipeline triggered by pushes to `main`, so that manual deployment steps are minimised and deployments are reproducible.

#### Acceptance Criteria

1. THE CI_CD_Pipeline SHALL be defined as a GitHub Actions workflow file at `.github/workflows/deploy.yml`.
2. WHEN a commit is pushed to the `main` branch, THE CI_CD_Pipeline SHALL execute the following steps in this order: (a) run backend tests, (b) build and push Backend and Frontend Docker images to the Container_Registry, (c) SSH into the Droplet and pull the new images, (d) run the migration container, (e) restart Backend and Frontend services. IF any step exits with a non-zero code, THE pipeline SHALL stop immediately and not execute subsequent steps.
3. IF a pipeline step fails, THE Droplet SHALL retain its pre-deployment state; no automatic rollback to a previous image version is required, but no partially-updated state SHALL be introduced.
4. BEFORE any deployment step runs, THE CI_CD_Pipeline SHALL verify that all required GitHub Actions secrets (`DO_API_TOKEN`, `DO_REGISTRY_TOKEN`, `SSH_PRIVATE_KEY`, `GROQ_API_KEY`) are present; IF any are missing, THE pipeline SHALL fail with a descriptive error message and skip all deployment steps.
5. THE CI_CD_Pipeline SHALL read all tokens and keys from GitHub Actions encrypted secrets and SHALL NOT echo or log any secret value.
6. WHEN the CI_CD_Pipeline completes successfully, THE pipeline SHALL poll `GET /health` on the Backend every 5 seconds for up to 60 seconds; IF the endpoint does not return HTTP 200 within 60 seconds, THE pipeline step SHALL exit with a non-zero code.
7. IF the migration step (step d) exits with a non-zero code, THEN THE CI_CD_Pipeline SHALL skip the service restart step (step e) and mark the pipeline as failed, leaving the existing Backend version running.

---

### Requirement 9: Health Checks and Observability

**User Story:** As a developer, I want health check endpoints and structured logging, so that I can verify the deployment is healthy and diagnose issues in production.

#### Acceptance Criteria

1. THE Backend SHALL expose a `GET /api/v1/health` endpoint; WHEN both the Database and Cache are reachable (each responding within 2 seconds), THE endpoint SHALL return HTTP 200 with a JSON body containing `"status"`, `"database"`, and `"redis"` fields all indicating a healthy state.
2. IF the Database is unreachable or does not respond within 2 seconds, THEN THE health endpoint SHALL return HTTP 503 with a JSON body where the `"database"` field indicates an error state and the `"redis"` field reflects its actual state.
3. IF the Cache is unreachable or does not respond within 2 seconds, THEN THE health endpoint SHALL return HTTP 503 with a JSON body where the `"redis"` field indicates an error state and the `"database"` field reflects its actual state.
4. IF both the Database and Cache are unreachable, THEN THE health endpoint SHALL return HTTP 503 with both the `"database"` and `"redis"` fields indicating an error state.
5. WHEN `DEBUG=false`, THE Backend SHALL emit structured JSON log entries; each log entry SHALL include at minimum the fields: `timestamp` (ISO-8601), `level`, `message`, and `module`. WHEN `DEBUG=true`, THE Backend SHALL emit human-readable log lines.
6. THE Reverse_Proxy SHALL log all requests using the combined log format; access logs SHALL be written to a configurable path (defaulting to `/var/log/nginx/access.log`) and error logs to a configurable path (defaulting to `/var/log/nginx/error.log`).

---

### Requirement 10: Cost Estimation and Resource Sizing

**User Story:** As a developer, I want a clear cost estimate for the chosen DigitalOcean topology, so that I can make an informed decision before committing to the infrastructure.

#### Acceptance Criteria

1. THE `docs/DEPLOYMENT.md` SHALL include a monthly cost estimate for the recommended topology: one $24/month Droplet (2 vCPU / 4 GB RAM), one $15/month Managed_Database (1 vCPU / 1 GB RAM / 10 GB SSD), and one $10/month Managed_Redis — totalling approximately $49/month.
2. THE `docs/DEPLOYMENT.md` SHALL include a budget topology option: one $12/month Droplet (1 vCPU / 2 GB RAM) with self-hosted PostgreSQL and Redis running as Docker containers on the same Droplet, with explicit notes on tradeoffs: no managed backups, single point of failure for all services, and limited headroom for traffic spikes.
3. THE `docs/DEPLOYMENT.md` SHALL include an App Platform cost estimate: one Basic Web Service at $5–$12/month, one Static Site at $0/month, and one Managed_Database at $15/month, with a note that App Platform does not support a self-hosted Redis and Managed_Redis adds $10/month.
4. THE `docs/DEPLOYMENT.md` SHALL cover all three deployment paths (Droplet recommended, Droplet budget, App Platform) and be the single reference for all deployment instructions defined in these requirements.
