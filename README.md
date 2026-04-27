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
- Contact: http://localhost:3000/en/contact
- Demo request: http://localhost:3000/en/demo-request
- Resource category examples: http://localhost:3000/en/resources/datasheets and http://localhost:3000/en/resources/case-studies

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

## Site analysis and content model

The implementation mirrors the current Krontech public structure with bilingual routes and CMS-owned content.
Detailed cross-reference notes are available in `docs/site-analysis.md`.

Primary page inventory:

- Home: `/tr`, `/en`
- Products: `/tr/products`, `/en/products`, product detail pages such as `/en/products/kron-pam`
- Solutions: `/en/solutions/*`, `/tr/solutions/*`
- Partners: `/en/partners`, `/tr/partners`
- Resources: `/en/resources`, `/tr/resources`, category pages such as `/en/resources/datasheets`, resource detail pages such as `/en/resources/critical-access-security-guide`
- Blog: `/en/blog`, `/tr/blog`, blog detail pages
- About: `/en/about-us/*`, `/tr/about-us/*`
- Forms: `/en/contact`, `/tr/contact`, `/en/demo-request`, `/tr/demo-request`

CMS content model:

- `Page` + `PageTranslation` + sortable `PageBlock` records for standard pages, home sections, solution/about/category pages and SEO/GEO metadata.
- `Product`, `BlogPost` and `Resource` entities with localized translations, publish status, scheduled publish date, version snapshots and structured data JSON.
- `MediaAsset` records stored in MinIO/S3-compatible object storage and reused by content editors.
- `FormDefinition`, `FormField` and `FormSubmission` records for contact/demo forms, validation, consent, submissions, CSV export and optional webhook forwarding.
- `RedirectRule`, `AuditLog` and `ContentVersion` support URL migration, editorial traceability and rollback.

Frontend component structure:

- Public shell/navigation: `apps/web/src/components/public` and `apps/web/src/lib/navigation.ts`
- SEO helpers and JSON-LD: `apps/web/src/lib/seo.ts`, `apps/web/src/components/seo`
- CMS-backed route renderers: `apps/web/src/app/[locale]`
- Admin workspaces: `apps/web/src/app/admin`
- API clients and typed payloads: `apps/web/src/lib`

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
- The public app uses SSR/ISR through Next.js server components and `fetch(..., { next: { revalidate } })`.
- Admin content workflows support `DRAFT`, `SCHEDULED` and `PUBLISHED`; publishing clears Redis cache and calls the Next.js revalidate endpoint.
- Role-based access uses JWT plus `ADMIN`/`EDITOR` guards. Editors can manage content drafts; admin-only operations include publish, restore, redirects and audit logs.
- Redis is used for public content cache. Prefix invalidation uses scan-based deletion rather than blocking `KEYS`.
- MinIO provides S3-compatible media uploads. Public URLs are built from `MINIO_PUBLIC_URL`.
- CAPTCHA is intentionally not included for the case scope; public forms use honeypot, throttling and server-side field validation.
- Swagger/OpenAPI is exposed at `/docs`; request throttling is enabled globally in the NestJS API.

## Form spam protection

- Public form submissions pass through the global NestJS throttler (`20` requests per minute per client by default).
- The public form renderer submits a hidden honeypot field; non-empty honeypot submissions are rejected as spam.
- Server-side validation rejects unknown fields, missing required fields, invalid email values, invalid select options and missing consent.
- CAPTCHA is not enabled; this is intentional for the local case demo and is documented as a tradeoff.

## SEO/GEO coverage

- Metadata supports canonical URLs, localized alternates, robots index/follow flags and Open Graph/Twitter fallbacks.
- Product, blog, resource and generic CMS pages can store structured data JSON.
- FAQ-style page blocks emit schema.org `FAQPage` JSON-LD when question/answer data exists.
- `sitemap.xml`, `robots.txt` and `llms.txt` cover seeded public routes and dynamic content.
- Redirect rules preserve legacy URL transitions and are manageable from `/admin/redirects`.

## Performance and accessibility

- Next.js image optimization is configured for AVIF/WebP output.
- Local WebP/AVIF visual assets live in `apps/web/public/images` and can be regenerated with `node scripts/generate-web-assets.cjs`.
- Public navigation includes skip-link, labelled nav regions and keyboard-visible focus states.
- See `docs/performance-accessibility-audit.md` for the closure checklist and Lighthouse handoff note.

## Test strategy

- API unit tests use Jest for service/controller behavior and validation logic.
- API e2e tests use Jest + Supertest against the NestJS HTTP layer for auth, protected admin access, public content, form submit/export, redirects and publish/revalidate behavior.
- Prisma is exercised through the application test module where endpoint behavior depends on persistence.
- Web verification uses TypeScript and `next build`; no separate browser test runner is introduced for this case scope.

## Delivery notes

- The Docker Compose setup is a local demo environment, not a hardened production deployment.
- For production, move secrets to a managed secret store, run migrations as a deployment step, use managed PostgreSQL/Redis/S3-compatible storage, and add centralized request/error logging.
- Horizontal web/API scaling is stateless except for PostgreSQL, Redis and object storage. Scheduled publishing should run as a single scheduler instance or be coordinated with a distributed lock in a larger deployment.
- AI assistance was used to accelerate implementation, cross-check requirements, improve tests and harden documentation. Final behavior is verified with local TypeScript/build/test commands.
- The PDF also asks for meaningful commit history and a presentation/live demo. Those are delivery artifacts outside the application code: keep commits readable and prepare a short demo script using the URLs and credentials above.
