# End Term Project: Comprehensive SRE Implementation

## Git Repository Link
Replace this line with your real GitHub/GitLab repository URL after upload.

## Project Summary
This repository demonstrates SRE practices for a distributed microservices system using:
- 6 FastAPI microservices
- Docker Compose and Docker Swarm
- Kubernetes manifests and HPA
- Terraform infrastructure provisioning template
- Ansible configuration management
- Prometheus monitoring and alerting
- Grafana dashboard provisioning
- Incident simulation and postmortem
- Capacity planning and automation strategy

## Services
1. auth-service: user login/security simulation
2. product-service: product catalog simulation
3. order-service: order processing simulation
4. payment-service: payment handling simulation
5. notification-service: alert/email simulation
6. profile-service: user profile simulation

## Local Run
```bash
docker compose up --build -d
curl http://localhost:8080/
curl http://localhost:8003/health
```

## Docker Swarm
```bash
docker swarm init
docker stack deploy -c docker-stack.yml sreapp
```

## Kubernetes
```bash
kubectl apply -f k8s/
kubectl get pods
kubectl get svc
```

## Terraform
```bash
cd terraform
terraform init
terraform apply -auto-approve
```

## Ansible
```bash
cd ansible
ansible-playbook -i inventory.ini playbook.yml
```

## Monitoring
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

## Incident Simulation
Set `BROKEN_DB=true` for order-service, redeploy, observe Prometheus/Grafana alerts, then restore configuration.

## CI/CD Pipeline
This project includes a ready GitHub Actions pipeline in `.github/workflows/ci-cd.yml`.

Pipeline stages:
1. **Validation and tests**: installs Python dependencies, checks Python imports with Ruff, compiles service code, validates Docker Compose, Kubernetes manifests, and Terraform.
2. **Build and smoke test**: builds all Docker images, starts the application stack with Docker Compose, then checks `/health`, `/ready`, and `/metrics` endpoints for every microservice.
3. **Publish images**: on pushes to `main` or `master`, builds and pushes service images to GitHub Container Registry.
4. **Deploy template**: placeholder stage for connecting a real server, Docker Swarm, Kubernetes cluster, or Ansible deployment.

To enable image publishing, push the repository to GitHub and make sure GitHub Actions has package write permissions. The workflow uses the built-in `GITHUB_TOKEN`, so no extra registry password is required for GHCR.

Useful local command before pushing:
```bash
chmod +x scripts/smoke_test.sh
docker compose up --build -d
./scripts/smoke_test.sh
docker compose down -v
```
