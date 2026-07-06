# Cloud agent base image for Mock API Studio monorepo.
# Do not COPY the project — Cursor checks out the repo at runtime.
FROM node:20-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    postgresql-client \
    docker.io \
    docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
