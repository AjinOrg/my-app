# syntax=docker/dockerfile:1

# ---- Build stage: install production dependencies only (none today, ready for later)
FROM public.ecr.aws/docker/library/node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY src ./src

# ---- Runtime stage: distroless = no shell, no package manager, only Node.js and the app
# Debian 13 base: the Debian 12 variant still carried fixable OpenSSL CVEs (1 critical, 5 high) found by Trivy
FROM gcr.io/distroless/nodejs22-debian13:nonroot
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080
COPY --from=build --chown=65532:65532 /app /app
# Non-root user (uid 65532 "nonroot"), as required by Pod Security "restricted"
USER 65532:65532
EXPOSE 8080
CMD ["src/server.js"]
