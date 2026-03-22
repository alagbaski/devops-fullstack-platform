# devops-fullstack-platform

A local-first DevOps showcase for running a production-style full-stack platform on a single Docker Compose stack. The repository combines a React frontend, a FastAPI backend, PostgreSQL persistence, a RabbitMQ-backed worker, and a monitoring layer with Prometheus, Grafana, node-exporter, and cAdvisor.

The goal is to keep the developer workflow simple while still demonstrating the moving parts of a modern platform:

- containerized application services
- reverse proxy routing through nginx
- synchronous API requests and asynchronous background processing
- metrics collection and dashboards
- environment-based configuration that can scale from local use to CI/CD or cloud deployment

## What is running in this repository

At a high level, the platform works like this:

- the React frontend runs on the local Vite dev server
- nginx exposes a single entrypoint on `http://localhost`
- frontend requests flow through nginx to the FastAPI backend under `/api`
- the backend stores items in PostgreSQL
- RabbitMQ provides the message broker used by the worker
- Prometheus scrapes metrics, and Grafana visualizes them
- node-exporter and cAdvisor provide host and container-level infrastructure metrics

### Architecture summary

```text
Browser
  ├─ http://localhost -> nginx
  │    ├─ frontend UI
  │    └─ /api/* -> FastAPI backend
  │
  ├─ backend -> PostgreSQL
  ├─ backend metrics -> Prometheus -> Grafana
  ├─ node-exporter metrics -> Prometheus
  └─ cAdvisor metrics -> Prometheus

RabbitMQ <-> worker
```

## Local development

Environment values are configurable through a `.env` file. Start from:

```bash
cp .env.example .env
```

Start the full stack:

```bash
docker compose up -d --build
```

Reset everything and boot from a clean state:

```bash
docker compose down -v --rmi all --remove-orphans
docker compose up -d --build
```

Inspect the stack:

```bash
docker compose ps
docker compose logs -f
```

## Service responsibilities

The current `docker-compose.yml` defines the following services:

- `db`  
  PostgreSQL 14 database used by the FastAPI backend. The backend creates the `items` table at startup if it does not already exist.

- `rabbitmq`  
  RabbitMQ 3.12 with the management UI enabled. It acts as the broker for background task processing.

- `backend`  
  FastAPI application that:
  - exposes `GET /items`
  - exposes `POST /items`
  - exposes Prometheus metrics at `/metrics`
  - connects to PostgreSQL using `psycopg2`

- `worker`  
  Celery worker connected to RabbitMQ. The repository currently includes a `tasks.send_email` task definition and keeps the async processing path in place for future extension.

- `frontend`  
  React app running on the Vite dev server. It uses the proxied API path `/api/items` from the browser-facing interface.

- `nginx`  
  Reverse proxy and public entrypoint for the local stack. It fronts the app on port 80 and routes API traffic to the backend.

- `prometheus`  
  Metrics scraper configured from `monitoring/prometheus.yml`.

- `grafana`  
  Dashboard UI with repo-provisioned configuration and dashboards.

- `node-exporter`  
  Host-level metrics exporter.

- `cadvisor`  
  Container metrics collector for Docker workloads.

## Useful local URLs

These URLs match the current repository setup and startup flow:

- `http://localhost` for the app through nginx
- `http://localhost:3000` for the React dev server
- `http://localhost:8000/items` for the backend API
- `http://localhost:8000/metrics` for backend Prometheus metrics
- `http://localhost:15672` for the RabbitMQ management UI
- `http://localhost:9090` for Prometheus
- `http://localhost:3001` for Grafana
- `http://localhost:8080` for cAdvisor container metrics

Grafana is provisioned from the repo:

- datasource: `Prometheus`
- dashboard folder: `Observability`
- default repo-managed dashboard: `Platform Overview`

## Local smoke-test checklist

After `docker compose up -d --build`, use this quick checklist to verify the stack without changing any code:

1. Confirm containers are up:

   ```bash
   docker compose ps
   ```

2. Open `http://localhost` and verify the UI loads through nginx.

3. Open `http://localhost:3000` and verify the Vite frontend is reachable directly.

4. Confirm the backend API responds:

   - visit `http://localhost:8000/items`
   - or use the frontend form to add a test item and confirm it appears in the list

5. Verify persistence:
   - add an item from the UI
   - refresh the page
   - confirm the item is still present

6. Confirm backend metrics are exposed at `http://localhost:8000/metrics`.

7. Open `http://localhost:15672` and verify the RabbitMQ management UI is available.

8. Open `http://localhost:9090` and verify Prometheus is running.

9. Open `http://localhost:3001` and verify Grafana loads the provisioned datasource and dashboard folder.

10. Optionally inspect infrastructure metrics:
    - `http://localhost:8080` for cAdvisor
    - `http://localhost:9100` for node-exporter metrics

## Troubleshooting

### Containers are not healthy or do not stay up

Check service status and recent logs:

```bash
docker compose ps
docker compose logs -f
```

If the stack was partially initialized or you want a full reset, use the existing clean-start flow:

```bash
docker compose down -v --rmi all --remove-orphans
docker compose up -d --build
```

### The frontend loads but API requests fail

Possible causes in the current stack:

- `backend` is still waiting for `db` or `rabbitmq`
- nginx is up, but the backend container has not finished starting
- the backend cannot connect to PostgreSQL because environment values in `.env` were changed incorrectly

Check:

```bash
docker compose logs -f backend
docker compose logs -f db
```

You can also test the backend directly at `http://localhost:8000/items`.

### The backend cannot connect to PostgreSQL

The backend reads:

- `DB_HOST`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

By default, the Compose network uses the database hostname `db`. If you edited `.env`, make sure those values still match the running database container.

Then inspect:

```bash
docker compose logs -f db
docker compose logs -f backend
```

### RabbitMQ or worker issues

If background processing is not behaving as expected, inspect the broker and worker:

```bash
docker compose logs -f rabbitmq
docker compose logs -f worker
```

Also verify the management UI is reachable at `http://localhost:15672`.

### Monitoring pages are empty

If Prometheus or Grafana opens but shows missing data:

- wait a minute for targets to be scraped
- verify the backend metrics page works at `http://localhost:8000/metrics`
- inspect Prometheus targets and logs

```bash
docker compose logs -f prometheus
docker compose logs -f grafana
```

### Port conflicts on localhost

This stack publishes ports for nginx, frontend, backend, RabbitMQ, Prometheus, Grafana, node-exporter, and cAdvisor. If startup fails because a port is already in use, either stop the conflicting local process or update the relevant value in `.env` before starting the stack again.

## Cloud readiness

The Compose file reads key credentials, image tags, ports, and the broker URL from environment variables. That means you can keep the same application code and inject environment-specific values through CI secrets, a cloud secret manager, or Terraform-generated environment variables instead of editing repository files.