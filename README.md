# devops-fullstack-platform
This project showcase designing and deploying a production-style microservices system with automated CI/CD pipeline, containerized services, asynchronous background processing, reverse proxy routing and cloud deployment.

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

Useful local URLs:

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

Inspect the stack:

```bash
docker compose ps
docker compose logs -f
```

## Cloud readiness

The Compose file now reads its key credentials, image tags, ports, and broker URL from environment variables. That means you can keep the same application code and inject cloud-specific values through CI secrets, a cloud secret manager, or Terraform-generated environment variables instead of editing the repository files.
