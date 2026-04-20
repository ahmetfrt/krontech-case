-- CreateEnum
CREATE TYPE "VersionEntityType" AS ENUM ('PAGE', 'PRODUCT', 'BLOG_POST', 'RESOURCE');

-- CreateTable
CREATE TABLE "ContentVersion" (
    "id" TEXT NOT NULL,
    "entityType" "VersionEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "createdById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentVersion_entityType_entityId_createdAt_idx" ON "ContentVersion"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVersion_entityType_entityId_versionNo_key" ON "ContentVersion"("entityType", "entityId", "versionNo");

-- AddForeignKey
ALTER TABLE "ContentVersion" ADD CONSTRAINT "ContentVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
