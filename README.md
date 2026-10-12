# my-app

Sample application for the AWS platform (EKS). A small Node.js HTTP service with **no runtime dependencies**.
How it is deployed lives in the platform repository: `AjinOrg/aws-platform` (`helm/my-app`, `gitops/apps/my-app`).

## Endpoints

| Path | Answer |
|---|---|
| `/healthz` | `{"status":"ok"}`: liveness (process is alive) |
| `/readyz` | `{"status":"ready"}`: readiness (used by Kubernetes and the load balancer health check) |
| anything else | App info: environment, version (image tag), pod name, path, and the demo `GREETING` secret |

## Configuration

| Variable | Default | Set by |
|---|---|---|
| `PORT` | `8080` | Helm chart |
| `APP_ENV` | `local` | Helm chart (`dev`, `staging`, `production`) |
| `APP_VERSION` | `dev` | Helm chart (the image tag) |
| `SECRETS_DIR` | `/etc/my-app/secrets` | Helm chart |

**Secrets** are files in `SECRETS_DIR`, one file per key (for example `GREETING`). They come from AWS Secrets
Manager through External Secrets and are mounted as a volume. The app reads the file on every use, so a changed
value arrives without a restart. Never return real secrets in a response; `GREETING` is a demo value.

## Develop
Node.js 22, or Docker if Node is not installed:
```bash
npm install
npm run lint
npm test
npm start          # http://localhost:8080

# without Node.js installed:
docker run --rm -v "$PWD":/app -w /app public.ecr.aws/docker/library/node:22-alpine sh -c "npm ci && npm run lint && npm test"
```

## Container image
```bash
docker build -t my-app:local .
docker run --rm -p 8080:8080 --read-only --cap-drop ALL my-app:local
```
- Multi-stage build; runtime image is **distroless** (no shell, no package manager).
- Runs as **non-root** (uid 65532), works with a **read-only** root filesystem.
- Handles `SIGTERM` (finishes open requests) for zero-downtime rollouts.

## How a change reaches the cluster
```
push to main → pipeline: lint, test, scans → build image (tag = commit SHA) → Trivy → push to ECR
            → pull request in aws-platform: gitops/apps/my-app/values-dev.yaml image.tag = <sha>
            → merged → ArgoCD deploys to dev → promoted to staging → production (approval)
```
The pipeline is added on Day 6. Until then the image is built and pushed by hand (see the platform README).
