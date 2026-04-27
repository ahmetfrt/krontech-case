import { BadRequestException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import {
  createPublishingFields,
  updatePublishingFields,
} from './publishing-fields';

describe('publishing fields', () => {
  it('requires scheduledAt for scheduled create', () => {
    expect(() =>
      createPublishingFields({ status: PublishStatus.SCHEDULED }),
    ).toThrow(BadRequestException);
  });

  it('clears schedule when content is manually published', () => {
    const fields = updatePublishingFields({
      status: PublishStatus.PUBLISHED,
      scheduledAt: '2026-05-01T12:00:00.000Z',
    });

    expect(fields).toEqual({
      publishedAt: expect.any(Date),
      scheduledAt: null,
      status: PublishStatus.PUBLISHED,
    });
  });

  it('stores scheduled date without publishing immediately', () => {
    const fields = createPublishingFields({
      status: PublishStatus.SCHEDULED,
      scheduledAt: '2026-05-01T12:00:00.000Z',
    });

    expect(fields.status).toBe(PublishStatus.SCHEDULED);
    expect(fields.publishedAt).toBeNull();
    expect(fields.scheduledAt).toEqual(new Date('2026-05-01T12:00:00.000Z'));
  });
});
