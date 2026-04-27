import { Locale, PublishStatus } from '@prisma/client';
import { PublishingService } from './publishing.service';

describe('PublishingService', () => {
  const prisma = {
    page: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    blogPost: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    resource: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const cacheService = {
    delByPrefix: jest.fn(),
  };
  const revalidateService = {
    revalidatePath: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.page.findMany.mockResolvedValue([]);
    prisma.product.findMany.mockResolvedValue([]);
    prisma.blogPost.findMany.mockResolvedValue([]);
    prisma.resource.findMany.mockResolvedValue([]);
    prisma.page.update.mockResolvedValue({});
    prisma.product.update.mockResolvedValue({});
    prisma.blogPost.update.mockResolvedValue({});
    prisma.resource.update.mockResolvedValue({});
    cacheService.delByPrefix.mockResolvedValue(undefined);
    revalidateService.revalidatePath.mockResolvedValue(undefined);
  });

  it('publishes due scheduled records and revalidates their public paths', async () => {
    prisma.page.findMany.mockResolvedValue([
      {
        id: 'page-1',
        translations: [
          { locale: Locale.TR, slug: 'ana-sayfa' },
          { locale: Locale.EN, slug: 'home-page' },
        ],
      },
    ]);
    prisma.product.findMany.mockResolvedValue([
      {
        id: 'product-1',
        translations: [
          { locale: Locale.TR, slug: 'pam-tr' },
          { locale: Locale.EN, slug: 'pam-en' },
        ],
      },
    ]);
    prisma.blogPost.findMany.mockResolvedValue([
      {
        id: 'blog-1',
        translations: [{ locale: Locale.TR, slug: 'blog-tr' }],
      },
    ]);
    prisma.resource.findMany.mockResolvedValue([
      {
        id: 'resource-1',
        translations: [{ locale: Locale.EN, slug: 'whitepaper' }],
      },
    ]);

    const service = new PublishingService(
      prisma as any,
      cacheService as any,
      revalidateService as any,
    );

    await service.publishScheduledContent();

    expect(prisma.page.update).toHaveBeenCalledWith({
      where: { id: 'page-1' },
      data: expect.objectContaining({
        status: PublishStatus.PUBLISHED,
        publishedAt: expect.any(Date),
        scheduledAt: null,
      }),
    });
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: expect.objectContaining({
        status: PublishStatus.PUBLISHED,
        publishedAt: expect.any(Date),
        scheduledAt: null,
      }),
    });
    expect(prisma.blogPost.update).toHaveBeenCalledWith({
      where: { id: 'blog-1' },
      data: expect.objectContaining({
        status: PublishStatus.PUBLISHED,
        publishedAt: expect.any(Date),
        scheduledAt: null,
      }),
    });
    expect(prisma.resource.update).toHaveBeenCalledWith({
      where: { id: 'resource-1' },
      data: expect.objectContaining({
        status: PublishStatus.PUBLISHED,
        publishedAt: expect.any(Date),
        scheduledAt: null,
      }),
    });

    expect(cacheService.delByPrefix).toHaveBeenCalledWith('page:');
    expect(cacheService.delByPrefix).toHaveBeenCalledWith('product:');
    expect(cacheService.delByPrefix).toHaveBeenCalledWith('blog:');
    expect(cacheService.delByPrefix).toHaveBeenCalledWith('resource:');

    expect(revalidateService.revalidatePath).toHaveBeenCalledWith('/tr');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith('/en');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/tr/products',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/tr/products/pam-tr',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/en/products/pam-en',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith('/tr/blog');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/tr/blog/blog-tr',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/en/resources',
    );
  });

  it('does not purge or revalidate when no scheduled content is due', async () => {
    const service = new PublishingService(
      prisma as any,
      cacheService as any,
      revalidateService as any,
    );

    await service.publishScheduledContent();

    expect(prisma.page.update).not.toHaveBeenCalled();
    expect(prisma.product.update).not.toHaveBeenCalled();
    expect(prisma.blogPost.update).not.toHaveBeenCalled();
    expect(prisma.resource.update).not.toHaveBeenCalled();
    expect(cacheService.delByPrefix).not.toHaveBeenCalled();
    expect(revalidateService.revalidatePath).not.toHaveBeenCalled();
  });
});
