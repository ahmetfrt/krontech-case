import { Locale, PublishStatus } from '@prisma/client';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const prisma = {
    product: {
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

  it('publishes products, clears scheduled time, purges cache, revalidates list/detail pages, and audits', async () => {
    const product = {
      id: 'product-1',
      productCode: 'PAM',
      status: PublishStatus.SCHEDULED,
      heroImage: null,
      translations: [
        { locale: Locale.TR, slug: 'pam-tr' },
        { locale: Locale.EN, slug: 'pam-en' },
      ],
    };
    prisma.product.findUnique.mockResolvedValue(product);
    prisma.product.update.mockResolvedValue({
      ...product,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date('2026-04-27T10:00:00.000Z'),
    });

    const service = new ProductsService(
      prisma as any,
      versionsService as any,
      cacheService as any,
      revalidateService as any,
      mediaService as any,
      auditService as any,
    );

    await service.publish('product-1', 'user-1');

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: expect.objectContaining({
        status: PublishStatus.PUBLISHED,
        publishedAt: expect.any(Date),
        scheduledAt: null,
      }),
      include: {
        translations: true,
        heroImage: true,
      },
    });
    expect(cacheService.delByPrefix).toHaveBeenCalledWith('product:');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/tr/products',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/tr/products/pam-tr',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/en/products',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/en/products/pam-en',
    );
    expect(auditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'CONTENT_PUBLISH',
      entityType: 'PRODUCT',
      entityId: 'product-1',
      metaJson: {
        productCode: 'PAM',
        trigger: 'manual',
      },
    });
  });
});
