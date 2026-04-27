import { Locale, PageType, PublishStatus } from '@prisma/client';
import { PagesService } from './pages.service';

describe('PagesService', () => {
  const prisma = {
    page: {
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
  const auditService = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes pages, clears scheduled time, purges page cache, revalidates locales, and audits', async () => {
    const page = {
      id: 'page-1',
      pageType: PageType.HOME,
      status: PublishStatus.SCHEDULED,
      translations: [
        { locale: Locale.TR, slug: 'ana-sayfa' },
        { locale: Locale.EN, slug: 'home-page' },
      ],
      blocks: [],
    };
    prisma.page.findUnique.mockResolvedValue(page);
    prisma.page.update.mockResolvedValue({
      ...page,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date('2026-04-27T10:00:00.000Z'),
    });

    const service = new PagesService(
      prisma as any,
      versionsService as any,
      cacheService as any,
      revalidateService as any,
      auditService as any,
    );

    await service.publish('page-1', 'user-1');

    expect(prisma.page.update).toHaveBeenCalledWith({
      where: { id: 'page-1' },
      data: expect.objectContaining({
        status: PublishStatus.PUBLISHED,
        publishedAt: expect.any(Date),
        scheduledAt: null,
        updatedById: 'user-1',
      }),
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    expect(cacheService.delByPrefix).toHaveBeenCalledWith('page:');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith('/tr');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith('/en');
    expect(auditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'CONTENT_PUBLISH',
      entityType: 'PAGE',
      entityId: 'page-1',
      metaJson: {
        trigger: 'manual',
      },
    });
  });
});
