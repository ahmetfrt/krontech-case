import { Locale, PublishStatus, ResourceType } from '@prisma/client';
import { ResourcesService } from './resources.service';

describe('ResourcesService', () => {
  const prisma = {
    resource: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const versionsService = {
    createVersion: jest.fn(),
  };
  const cacheService = {
    delByPrefix: jest.fn(),
  };
  const revalidateService = {
    revalidatePath: jest.fn(),
  };
  const mediaService = {
    withPublicUrl: jest.fn((item) => item ?? null),
  };
  const auditService = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes resources, clears scheduled time, purges cache, revalidates resource lists, and audits', async () => {
    const resource = {
      id: 'resource-1',
      resourceType: ResourceType.WHITEPAPER,
      status: PublishStatus.SCHEDULED,
      file: null,
      translations: [
        { locale: Locale.TR, slug: 'rapor' },
        { locale: Locale.EN, slug: 'report' },
      ],
    };
    prisma.resource.findUnique.mockResolvedValue(resource);
    prisma.resource.update.mockResolvedValue({
      ...resource,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date('2026-04-27T10:00:00.000Z'),
    });

    const service = new ResourcesService(
      prisma as any,
      versionsService as any,
      cacheService as any,
      revalidateService as any,
      mediaService as any,
      auditService as any,
    );

    await service.publish('resource-1', 'user-1');

    expect(prisma.resource.update).toHaveBeenCalledWith({
      where: { id: 'resource-1' },
      data: expect.objectContaining({
        status: PublishStatus.PUBLISHED,
        publishedAt: expect.any(Date),
        scheduledAt: null,
      }),
      include: {
        file: true,
        translations: true,
      },
    });
    expect(cacheService.delByPrefix).toHaveBeenCalledWith('resource:');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/tr/resources',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/en/resources',
    );
    expect(auditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'CONTENT_PUBLISH',
      entityType: 'RESOURCE',
      entityId: 'resource-1',
      metaJson: {
        resourceType: ResourceType.WHITEPAPER,
        trigger: 'manual',
      },
    });
  });
});
