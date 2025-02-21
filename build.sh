#!/bin/bash

# Calculate build tag using current date and time
# Format: MMDDHHMI (Month Day Hour Minute)
BUILD_TAG=$(date +'%m%d%H%M')
IMAGE_NAME="tribehealth/bolt-ai"

# Set up buildx builder if it doesn't exist
docker buildx create --name multiarch-builder --driver docker-container --use || true
docker buildx use multiarch-builder

echo "Building image with tag: ${BUILD_TAG}"
echo "Starting build at: $(date)"

# Build multi-arch image in one command
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t ${IMAGE_NAME}:${BUILD_TAG} \
    -t ${IMAGE_NAME}:latest \
    -f Dockerfile-k8s \
    --push .

echo "Build completed at: $(date)"
echo "Image tags pushed:"
echo "- ${IMAGE_NAME}:${BUILD_TAG}"
echo "- ${IMAGE_NAME}:latest"
