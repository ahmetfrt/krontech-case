# Performance And Accessibility Closure Notes

Date: 2026-04-27

## Implemented Performance Measures

- Next.js image optimization is configured for AVIF and WebP output in `apps/web/next.config.ts`.
- Local AVIF/WebP visual assets are stored under `apps/web/public/images`.
- Homepage hero uses a priority `next/image` asset with explicit dimensions and responsive `sizes`.
- Product, blog and resource listing visuals use `next/image` with explicit dimensions and lazy loading where below the fold.
- Public content fetches use server rendering with revalidation windows.
- Redis application cache is used by the API; publishing invalidates Redis keys and triggers Next.js revalidation.
- MinIO/S3-compatible media storage is used for uploaded media.

## Implemented Accessibility Measures

- Public layout includes a keyboard-accessible skip link to main content.
- Header, mobile navigation and footer navigation expose `aria-label` values.
- Mega menu is available on hover and keyboard focus via `focus-within`.
- Global `:focus-visible` styling makes keyboard focus visible.
- Form submit feedback uses `role="status"` and `aria-live="polite"`.
- Decorative listing fallback images use empty alt text; informational hero images use descriptive alt text.
- Primary pages use semantic `main`, `section`, `article`, `header`, `nav`, `figure` and heading structure.

## Remaining External Verification

The codebase is ready for Lighthouse/Core Web Vitals verification, but real Core Web Vitals depend on the evaluator machine, browser, CPU/network profile and final deployment host. For final delivery, run Lighthouse against the local or deployed URLs and attach the report if the case reviewer expects numeric evidence.

Recommended URLs:

- `http://localhost:3000/en`
- `http://localhost:3000/tr`
- `http://localhost:3000/en/products`
- `http://localhost:3000/en/demo-request`
- `http://localhost:3000/admin`
