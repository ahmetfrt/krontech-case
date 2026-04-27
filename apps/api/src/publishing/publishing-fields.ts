import { BadRequestException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';

export function createPublishingFields(params: {
  scheduledAt?: string | null;
  status?: PublishStatus;
}) {
  const status = params.status ?? PublishStatus.DRAFT;

  if (status === PublishStatus.SCHEDULED) {
    if (!params.scheduledAt) {
      throw new BadRequestException('scheduledAt is required for scheduled content');
    }

    return {
      status,
      scheduledAt: new Date(params.scheduledAt),
      publishedAt: null,
    };
  }

  return {
    status,
    scheduledAt: null,
    ...(status === PublishStatus.PUBLISHED ? { publishedAt: new Date() } : {}),
  };
}

export function updatePublishingFields(params: {
  scheduledAt?: string | null;
  status?: PublishStatus;
}) {
  if (params.status === PublishStatus.SCHEDULED) {
    if (!params.scheduledAt) {
      throw new BadRequestException('scheduledAt is required for scheduled content');
    }

    return {
      status: params.status,
      scheduledAt: new Date(params.scheduledAt),
      publishedAt: null,
    };
  }

  if (params.status === PublishStatus.PUBLISHED) {
    return {
      status: params.status,
      scheduledAt: null,
      publishedAt: new Date(),
    };
  }

  if (params.status === PublishStatus.DRAFT) {
    return {
      status: params.status,
      scheduledAt: null,
      publishedAt: null,
    };
  }

  if (params.scheduledAt !== undefined) {
    return {
      scheduledAt: params.scheduledAt ? new Date(params.scheduledAt) : null,
    };
  }

  return {};
}
