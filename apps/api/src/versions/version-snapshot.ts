import { Locale, PageType, PublishStatus, ResourceType } from '@prisma/client';
import { Prisma } from '@prisma/client';

export type SnapshotRecord = Record<string, unknown>;

export function asSnapshotRecord(value: unknown): SnapshotRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as SnapshotRecord)
    : {};
}

export function snapshotArray(value: unknown) {
  return Array.isArray(value) ? value.map(asSnapshotRecord) : [];
}

export function snapshotString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function snapshotNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function snapshotBoolean(value: unknown, fallback = true) {
  return typeof value === 'boolean' ? value : fallback;
}

export function snapshotDate(value: unknown): Date | null {
  return typeof value === 'string' || value instanceof Date ? new Date(value) : null;
}

export function snapshotJson(value: unknown): Prisma.InputJsonValue | undefined {
  return value === undefined || value === null
    ? undefined
    : (value as Prisma.InputJsonValue);
}

export function snapshotLocale(value: unknown): Locale {
  return value === Locale.EN || value === Locale.TR ? value : Locale.TR;
}

export function snapshotStatus(value: unknown): PublishStatus {
  if (
    value === PublishStatus.DRAFT ||
    value === PublishStatus.PUBLISHED ||
    value === PublishStatus.SCHEDULED
  ) {
    return value;
  }

  return PublishStatus.DRAFT;
}

export function snapshotPageType(value: unknown): PageType {
  if (
    value === PageType.HOME ||
    value === PageType.STANDARD ||
    value === PageType.RESOURCES ||
    value === PageType.CONTACT
  ) {
    return value;
  }

  return PageType.STANDARD;
}

export function snapshotResourceType(value: unknown): ResourceType {
  if (
    value === ResourceType.CASE_STUDY ||
    value === ResourceType.DATASHEET ||
    value === ResourceType.OTHER ||
    value === ResourceType.PODCAST ||
    value === ResourceType.WHITEPAPER
  ) {
    return value;
  }

  return ResourceType.OTHER;
}
