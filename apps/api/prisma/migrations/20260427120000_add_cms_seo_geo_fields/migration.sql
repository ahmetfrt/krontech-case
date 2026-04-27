ALTER TABLE "PageTranslation"
ADD COLUMN "structuredDataJson" JSONB;

ALTER TABLE "ProductTranslation"
ADD COLUMN "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "structuredDataJson" JSONB;

DROP INDEX IF EXISTS "PageTranslation_slug_key";
DROP INDEX IF EXISTS "ProductTranslation_slug_key";
DROP INDEX IF EXISTS "BlogPostTranslation_slug_key";
DROP INDEX IF EXISTS "ResourceTranslation_slug_key";

CREATE UNIQUE INDEX "PageTranslation_locale_slug_key" ON "PageTranslation"("locale", "slug");
CREATE UNIQUE INDEX "ProductTranslation_locale_slug_key" ON "ProductTranslation"("locale", "slug");
CREATE UNIQUE INDEX "BlogPostTranslation_locale_slug_key" ON "BlogPostTranslation"("locale", "slug");
CREATE UNIQUE INDEX "ResourceTranslation_locale_slug_key" ON "ResourceTranslation"("locale", "slug");

ALTER TABLE "BlogPostTranslation"
ADD COLUMN "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "structuredDataJson" JSONB;

ALTER TABLE "ResourceTranslation"
ADD COLUMN "ogTitle" TEXT,
ADD COLUMN "ogDescription" TEXT,
ADD COLUMN "canonicalUrl" TEXT,
ADD COLUMN "robotsIndex" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "robotsFollow" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "structuredDataJson" JSONB;
