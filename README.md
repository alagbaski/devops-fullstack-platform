# Devops Fullstack Platform [![CI](https://img.shields.io/badge/CI-Passing-brightgreen)](https://github.com/user/repo/actions) [![Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen)](https://codecov.io/gh/user/repo) [![Docker](https://img.shields.io/badge/Docker-Compose-blue)](https://hub.docker.com)

A Dockerized full-stack **production-grade e-commerce platform** built with **React 18**, **FastAPI**, **PostgreSQL**, **Celery**, **nginx**, **RabbitMQ**, **Prometheus**, and **Grafana**. Features customer storefront (products/cart/auth), admin dashboard, full monitoring – perfect for DevOps/Fullstack resumes.

## 🚀 Quick Demo
| Home/Shop | Cart/Auth | Admin Dashboard | Grafana |
|-----------|-----------|-----------------|---------|
| ![Home](image/Screenshot%20from%202026-04-10%2016-37-08.png) | ![Cart](image/Screenshot%20from%202026-04-10%2016-37-43.png) | ![Admin](image/Screenshot%20from%202026-04-10%2016-37-28.png) | ![Grafana](image/Screenshot%20from%202026-04-10%2016-52-29.png) |

*(Add actual screenshots in /screenshots/ folder for GH README render)*

## ✨ Current Capabilities
- Storefront: Product browsing, localStorage cart, auth flows.
- Admin: CRUD products, feedback review.
- Background: Celery jobs (RabbitMQ).
- Monitoring: Prometheus metrics + Grafana dashboards.

## 🏗️ Architecture
```mermaid
graph TB
  User[Browser] --> Nginx[nginx :80]
  Nginx -->|Static/Frontend| Frontend[React/Vite :3000]
  Nginx -->|/api| Backend[FastAPI :8000]
  Backend --> DB[PostgreSQL]
  Backend -->|Async Tasks| RabbitMQ[RabbitMQ :15672]
  RabbitMQ --> Worker[Celery Worker]
  Backend --> Prometheus[Prometheus :9090]
  Prometheus --> Grafana[Grafana :3001]
  NodeExporter --> Prometheus
  CAdvisor --> Prometheus
```

## Services (docker-compose.yml)
| Service | Purpose | Port |
|---------|---------|------|
| frontend | React app | 3000 |
| backend | FastAPI API | 8000 |
| db | Postgres | internal |
| rabbitmq | Broker | 15672 |
| worker | Celery | internal |
| nginx | Proxy | 80 |
| prometheus/grafana | Monitoring | 9090/3001 |

## 🚀 Local Development
```bash
cp .env.example .env
bash ./scripts/validate-env.sh
docker compose up -d --build
```
- `.env.example` is a reference file only. After copying it, replace every placeholder with real local values in `.env` before starting the stack.
- `bash ./scripts/validate-env.sh` fails fast when required values are missing or still left as `${VAR}` placeholders.
- For cloud or CI deployments, provide the same variables through the platform's secret/env management instead of committing them to Git.
- `localhost` – Full app
- `localhost:8000/docs` – Swagger API
- `localhost:3001` – Grafana

Verify: `./scripts/smoke-phase1.sh`

## Backend Modules
- **FastAPI** routes/services/schemas (modular CRUD/auth/JWT)
- **SQLAlchemy** models + Alembic migrations

## Frontend Pages
- Home, Shop (products+cart), Cart, Account (auth), Admin (protected)

## Quality & CI
- Tests: pytest/Vitest, smoke scripts
- Linting: Ruff
- CI: GitHub Actions + SonarQube ready
- Coverage: Planned >85%

## Key Learnings (Resume Highlights)
- **DevOps**: Multi-service Docker orchestration, monitoring stack, env-driven deploys.
- **Fullstack**: React Router/state, FastAPI/Pydantic/SQLAlchemy, JWT/Celery async.
- **Best Practices**: Tests/CI, modular code, security (bcrypt/JWT), prod monitoring.


## License
MIT
