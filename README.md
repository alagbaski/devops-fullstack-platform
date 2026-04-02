# devops-fullstack-platform

A Dockerized full-stack commerce platform built with React, FastAPI, PostgreSQL, nginx, RabbitMQ, Prometheus, and Grafana. The app now behaves like a small production-style storefront instead of a raw API demo: customers browse products through page-based UI flows, manage a local cart, authenticate through the frontend, and admins manage products from a protected dashboard.

## Current capabilities

- storefront product listing through the frontend
- frontend-managed cart persisted in local storage
- signup and login against FastAPI auth endpoints
- admin dashboard for product creation, publish/hide controls, and safe system links
- feedback submission endpoint for authenticated users and admin review endpoint
- Docker Compose orchestration with monitoring and background worker services

## Architecture

```text
Browser
  -> nginx
     -> React frontend
     -> /api/* -> FastAPI backend

FastAPI
  -> PostgreSQL
  -> RabbitMQ / worker
  -> Prometheus metrics

Prometheus -> Grafana
node-exporter / cAdvisor -> Prometheus
```

## Services

- `frontend`
  React application served in development through Vite and fronted by nginx.

- `backend`
  FastAPI application that handles auth, products, admin routes, feedback, legacy demo routes, and metrics.

- `db`
  PostgreSQL database for users, products, feedback, and legacy item persistence.

- `rabbitmq`
  Message broker used by the worker service.

- `worker`
  Background worker process connected to RabbitMQ.

- `nginx`
  Public entrypoint for the app and reverse proxy for API requests.

- `prometheus`
  Metrics scraping for the application and infrastructure services.

- `grafana`
  Dashboard UI for observability.

- `node-exporter`
  Host-level metrics exporter.

- `cadvisor`
  Container metrics collector.

## Local development

Create a local environment file:

```bash
cp .env.example .env
```

Start the stack:

```bash
docker compose up -d --build
```

Inspect the running services:

```bash
docker compose ps
docker compose logs -f
```

Reset from scratch if needed:

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
```

## Main local URLs

- `http://localhost`
  Main app through nginx

- `http://localhost:3000`
  Frontend development server

- `http://localhost:8000/health`
  Backend health endpoint

- `http://localhost:8000/metrics`
  Backend metrics endpoint

- `http://localhost:15672`
  RabbitMQ management UI

- `http://localhost:9090`
  Prometheus

- `http://localhost:3001`
  Grafana

## Frontend pages

The public UI now uses simple page-style navigation instead of exposing raw backend endpoints directly:

- `Home`
  Overview and social/community links

- `Shop`
  Product listing with add-to-cart actions

- `Cart`
  Full cart page backed by browser local storage

- `Account`
  Signup and login screens connected to the backend API

- `Admin`
  Protected product management and operational links

## Backend modules

The backend is organized incrementally into small modules:

- `routes/`
  API route groupings for auth, admin, products, feedback, items, and system endpoints

- `services/`
  Data access and business logic for users, products, and feedback

- `schemas/`
  Request and response models

- `security/`
  Password hashing and JWT handling

- `models/`
  Lightweight data representations used by services

## Verification

The repository includes a smoke test for the currently implemented backend flows:

```bash
./scripts/smoke-phase1.sh
```

It verifies:

- backend health
- API v1 root
- signup and login
- authenticated profile flow assumptions already used by the app
- admin login
- product creation and listing
- legacy item read/write path

For cart-specific manual checks, use:

- [docs/phase3-manual-checklist.md](/home/alagbaski/Documents/DevOps/devops-fullstack-platform/docs/phase3-manual-checklist.md)

## Quality Checks

The repository now includes a dedicated CI quality workflow in
[.github/workflows/quality.yml](/home/alagbaski/Documents/DevOps/devops-fullstack-platform/.github/workflows/quality.yml).

It runs:

- backend tests with coverage
- `ruff` lint checks
- frontend dependency install and production build
- SonarQube analysis when GitHub secrets are configured

To enable SonarQube scanning in GitHub Actions, add these repository secrets:

- `SONAR_HOST_URL`
  Your SonarQube server URL

- `SONAR_TOKEN`
  A token with permission to analyze this project

Project analysis settings live in
[sonar-project.properties](/home/alagbaski/Documents/DevOps/devops-fullstack-platform/sonar-project.properties).

## Notes

- Public UI pages intentionally avoid linking users directly to raw backend endpoints.
- Operational links remain available in the protected admin area.
- The legacy `items` API still exists for compatibility and smoke testing, but it is no longer part of the public storefront experience.

## Cloud readiness

The stack is already environment-driven through `.env` values and Docker Compose variables, which makes it portable to GitHub Actions, cloud secret stores, or infrastructure automation later without changing application code.
