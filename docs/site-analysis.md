# Krontech Site Analysis And Implementation Map

Date: 2026-04-27

Reference: https://krontech.com/

## Public Site Inventory

The live Krontech navigation is organized around these top-level groups:

- Products
- Solutions
- Partners
- Resources
- About Us
- Contact
- EN/TR language switch

Implemented public routes:

- Home: `/tr`, `/en`
- Products index: `/tr/products`, `/en/products`
- Product detail: `/tr/products/[slug]`, `/en/products/[slug]`
- Solutions: `/tr/solutions/[slug]`, `/en/solutions/[slug]`
- Partners: `/tr/partners`, `/en/partners`
- Resources index: `/tr/resources`, `/en/resources`
- Resource categories: `/tr/resources/datasheets`, `/en/resources/datasheets`, `/tr/resources/case-studies`, `/en/resources/case-studies`, `/tr/resources/podcast`, `/en/resources/podcast`
- Resource detail: `/tr/resources/[slug]`, `/en/resources/[slug]`
- Blog index/detail: `/tr/blog`, `/en/blog`, `/tr/blog/[slug]`, `/en/blog/[slug]`
- About pages: `/tr/about-us/[slug]`, `/en/about-us/[slug]`
- Forms: `/tr/contact`, `/en/contact`, `/tr/demo-request`, `/en/demo-request`
- SEO/GEO support files: `/sitemap.xml`, `/robots.txt`, `/llms.txt`

## Navigation Mapping

Products:

- Privileged Access Management -> `/products/kron-pam`
- Kron PAM -> `/products/kron-pam`
- Cloud PAM -> `/products/cloud-pam`
- Password Vault -> `/products/password-vault`
- Privileged Session Manager -> `/products/privileged-session-manager`
- Database Access Manager -> `/products/database-access-manager`
- Privileged Task Automation -> `/products/privileged-task-automation`
- Endpoint Privilege Management -> `/products/endpoint-privilege-management`
- User Behavior Analytics -> `/products/user-behavior-analytics`
- Multi-Factor Authentication -> `/products/multi-factor-authentication`
- Unified Access Manager -> `/products/unified-access-manager`
- AAA Server -> `/products/aaa-server`
- AAA Server & Subscriber Management -> `/products/aaa-server`
- Telemetry Pipeline -> `/products/telemetry-pipeline`
- Dynamic Data Masking -> `/products/dynamic-data-masking`
- IPDR Logging -> `/products/ipdr-logging`
- Quality Assurance -> `/products/quality-assurance`

Solutions:

- PAM as a Service -> `/solutions/pam-as-a-service`
- Secure Remote Access -> `/solutions/secure-remote-access`
- Insider Threat Protection -> `/solutions/insider-threat-protection`
- Zero Trust and Least Privilege -> `/solutions/zero-trust-and-least-privilege`
- Audit and Regulatory Compliance -> `/solutions/audit-and-regulatory-compliance`
- Network Access Control for IoT/POS -> `/solutions/network-access-control-for-iot-pos-systems`
- Security Provisioning -> `/solutions/security-provisioning`
- OT Security with Kron PAM -> `/solutions/ot-security-with-kron-pam`
- Replace Cisco CPAR with Kron AAA -> `/solutions/replace-cisco-cpar-with-kron-aaa`
- Petabyte-Scale Telco Data Retention -> `/solutions/petabyte-scale-telco-data-retention`
- GPON Provisioning & Service Activation -> `/solutions/gpon-provisioning-service-activation`
- Reduce Log Volume -> `/solutions/reduce-log-volume`
- Data Rehydration -> `/solutions/data-rehydration`
- Security Data Management -> `/solutions/security-data-management`

Resources:

- Datasheets -> `/resources/datasheets`
- Case Studies -> `/resources/case-studies`
- Blog -> `/blog`
- Podcast -> `/resources/podcast`

About Us:

- About Us -> `/about-us`
- Management -> `/about-us/management`
- Board of Directors -> `/about-us/board-of-directors`
- Careers -> `/about-us/careers`
- Newsroom -> `/about-us/newsroom`
- Announcements -> `/about-us/announcements`
- Investor Relations -> `/about-us/investor-relations`
- Logo Guidelines -> `/about-us/logo-guidelines`

## Content Model

- `Page`: standard pages, homepage and generic CMS pages.
- `PageTranslation`: locale-specific title, slug, summary and SEO/GEO metadata.
- `PageBlock`: sortable page sections rendered by the public CMS route.
- `Product` + `ProductTranslation`: product catalogue and localized detail pages.
- `BlogPost` + `BlogPostTranslation`: article list/detail workflow.
- `Resource` + `ResourceTranslation`: downloadable or external resource entries.
- `MediaAsset`: reusable MinIO/S3 object metadata.
- `FormDefinition` + `FormField` + `FormSubmission`: CMS-managed contact/demo forms and inbox.
- `RedirectRule`: URL migration and legacy redirect management.
- `ContentVersion`: snapshot and restore support for editorial content.
- `AuditLog`: admin/editor action traceability.

## Frontend Component Structure

- Public shell and navigation: `apps/web/src/components/public/site-shell.tsx`, `apps/web/src/lib/navigation.ts`
- CMS route rendering: `apps/web/src/app/[locale]/[...slug]/page.tsx`
- Products/resources/blog route rendering: `apps/web/src/app/[locale]`
- Form renderer: `apps/web/src/components/contact/page.tsx`
- SEO helpers and JSON-LD: `apps/web/src/lib/seo.ts`, `apps/web/src/components/seo/json-ld.tsx`
- Admin screens: `apps/web/src/app/admin`, `apps/web/src/components/admin`

## Design Preservation Notes

The implementation keeps the live site's enterprise cybersecurity structure: dark security-focused hero treatment, red Kron accent, dense mega navigation, products/solutions/resources/about URL inventory, bilingual navigation and content hierarchy. It is not intended as a pixel-perfect copy of Kron's proprietary frontend, but the visible information architecture and page families are represented end to end.
