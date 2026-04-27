# Krontech Case Study

Bilingual Krontech website rebuild with a Next.js public site, NestJS CMS/API, PostgreSQL, Redis cache, MinIO media storage, role-based admin, scheduled publishing, forms, redirects, SEO/GEO metadata and automated tests.

## Requirements

- Node.js 20 (`.nvmrc` is included)
- Docker and Docker Compose
- npm

## One-command demo

```bash
cp .env.example .env
docker compose up --build
```

The API container runs `prisma migrate deploy` and `prisma db seed` before starting. Seed data includes admin/editor users, TR/EN pages, products, blog posts, resources, contact/demo forms and redirect rules.

Demo URLs:

- Web: http://localhost:3000/tr and http://localhost:3000/en
- Admin: http://localhost:3000/admin
- API health: http://localhost:3001/health
- Swagger: http://localhost:3001/docs
- MinIO console: http://localhost:9001

Demo login:

- Admin: `admin@krontech.local` / `Admin123!`
- Editor: `editor@krontech.local` / `Editor123!`

## Local development

Start infrastructure only:

```bash
docker compose up postgres redis minio
```

API:

```bash
cd apps/api
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

Web:

```bash
cd apps/web
npm install
npm run dev
```

Important API/web env split:

- Browser calls use `NEXT_PUBLIC_API_URL` such as `http://localhost:3001`.
- Server/container calls use `API_INTERNAL_URL` such as `http://api:3001`.
- Publish revalidation uses `NEXT_REVALIDATE_BASE_URL` and `NEXT_REVALIDATE_SECRET`.

## Test commands

API:

```bash
cd apps/api
npx tsc --noEmit
npm test -- --runInBand
npm run test:cov -- --runInBand
npm run build
npm run test:e2e -- --runInBand
```

Web:

```bash
cd apps/web
npx tsc --noEmit
npm run build
```

Root:

```bash
git diff --check
docker compose config
```

## Architecture notes

- Public rendering is CMS-backed where possible: pages, products, blog, resources, contact form definitions and SEO metadata come from the API.
- Admin content workflows support `DRAFT`, `SCHEDULED` and `PUBLISHED`; publishing clears Redis cache and calls the Next.js revalidate endpoint.
- Role-based access uses JWT plus `ADMIN`/`EDITOR` guards. Editors can manage content drafts; admin-only operations include publish, restore, redirects and audit logs.
- Redis is used for public content cache. Prefix invalidation uses scan-based deletion rather than blocking `KEYS`.
- MinIO provides S3-compatible media uploads. Public URLs are built from `MINIO_PUBLIC_URL`.
- CAPTCHA is intentionally not included for the case scope; public forms use honeypot, throttling and server-side field validation.

## SEO/GEO coverage

- Metadata supports canonical URLs, localized alternates, robots index/follow flags and Open Graph/Twitter fallbacks.
- Product, blog, resource and generic CMS pages can store structured data JSON.
- `sitemap.xml`, `robots.txt` and `llms.txt` cover seeded public routes and dynamic content.
- Redirect rules preserve legacy URL transitions and are manageable from `/admin/redirects`.

## Delivery notes

- The Docker Compose setup is a local demo environment, not a hardened production deployment.
- For production, move secrets to a managed secret store, run migrations as a deployment step, use managed PostgreSQL/Redis/S3-compatible storage, and add centralized request/error logging.
- Horizontal web/API scaling is stateless except for PostgreSQL, Redis and object storage. Scheduled publishing should run as a single scheduler instance or be coordinated with a distributed lock in a larger deployment.
- AI assistance was used to accelerate implementation, cross-check requirements, improve tests and harden documentation. Final behavior is verified with local TypeScript/build/test commands.
