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
PR to main   → checks: Gitleaks, lint, tests + coverage, SonarQube Cloud quality gate, npm audit / OWASP,
               Trivy (fs + image), Kyverno  → must be green to merge
merge to main → same checks → image pushed to ECR (tag = 7-char commit SHA, GitHub OIDC)
             → dev:        PR in aws-platform merges itself after platform-ci, then smoke-tested (automatic)
             → staging:    a person starts the release (form or menu) and picks a tag that ran in dev
             → production: a person starts the release, picks a tag that ran in staging, and a Code Owner approves
```
Details: `AjinOrg/aws-platform` README, "Step 11: Continuous Delivery". Run the tests with coverage locally:
`npm run test:coverage` (writes `coverage/lcov.info`, the file SonarQube Cloud reads).
