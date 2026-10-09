#!/usr/bin/env bash
set -e

# Configuration (override via environment variables)
IMAGE_NAME="${IMAGE_NAME:-help-api}"
REGISTRY="${REGISTRY:-}" # e.g. docker.io/username or ghcr.io/org
TAG="${TAG:-latest}"
CONTAINER_NAME="${CONTAINER_NAME:-help-api-container}"
PORT="${PORT:-3000}"
ENV_FILE="${ENV_FILE:-.env}"

FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"
if [ -n "$REGISTRY" ]; then
    FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"
fi

echo "=========================================="
echo " Building & Deploying Backend API"
echo " Image: ${FULL_IMAGE_NAME}"
echo "=========================================="

# Step 1: Build Docker Image
echo "[1/3] Building Docker image..."
docker build -t "${FULL_IMAGE_NAME}" -f api/Dockerfile ./api

# Step 2: Push Image (if registry is specified)
if [ -n "$REGISTRY" ]; then
    echo "[2/3] Pushing Docker image to registry..."
    docker push "${FULL_IMAGE_NAME}"
else
    echo "[2/3] Registry not set, skipping docker push."
fi

# Step 3: Run / Deploy Container
echo "[3/3] Deploying Docker container locally..."

if [ ! -f "$ENV_FILE" ] && [ ! -f "api/.env" ]; then
    echo "WARNING: No .env file found at $ENV_FILE or api/.env."
    echo "Make sure required environment variables are set."
fi

# Stop and remove existing container if running
if [ $(docker ps -aq -f name="^${CONTAINER_NAME}$") ]; then
    echo "Stopping existing container: ${CONTAINER_NAME}..."
    docker stop "${CONTAINER_NAME}" || true
    docker rm "${CONTAINER_NAME}" || true
fi

# Determine which env file to use
ENV_OPTION=""
if [ -f "$ENV_FILE" ]; then
    ENV_OPTION="--env-file $ENV_FILE"
elif [ -f "api/.env" ]; then
    ENV_OPTION="--env-file api/.env"
fi

# Start new container
echo "Starting container ${CONTAINER_NAME} on port ${PORT}..."
docker run -d \
    --name "${CONTAINER_NAME}" \
    --restart always \
    -p "${PORT}:3000" \
    ${ENV_OPTION} \
    "${FULL_IMAGE_NAME}"

echo "=========================================="
echo " Backend deployment complete!"
echo " Status: $(docker inspect -f '{{.State.Status}}' ${CONTAINER_NAME})"
echo " URL: http://localhost:${PORT}"
echo " Docs: http://localhost:${PORT}/docs"
echo "=========================================="
