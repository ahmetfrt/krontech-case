# Krontech Case Study

This project is a case study for rebuilding krontech.com with a modern, manageable, and scalable architecture.

## Tech Stack

- Frontend: Next.js + TypeScript
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- Cache: Redis
- Object Storage: MinIO (S3-compatible)
- ORM: Prisma
- Containerization: Docker Compose

## Project Structure

```text
apps/
  web/        # Next.js frontend
  api/        # NestJS backend
packages/
  shared/     # shared types/constants
docker/       # docker-related files if needed