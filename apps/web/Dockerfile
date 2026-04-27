FROM node:20-bookworm-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG API_INTERNAL_URL=http://api:3001
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_REVALIDATE_SECRET=local_revalidate_secret

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV API_INTERNAL_URL=$API_INTERNAL_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_REVALIDATE_SECRET=$NEXT_REVALIDATE_SECRET

COPY next.config.ts tsconfig.json postcss.config.mjs ./
COPY public ./public
COPY src ./src
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npm run start -- -p ${WEB_PORT:-3000}"]
