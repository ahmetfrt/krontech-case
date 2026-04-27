import { NotFoundException } from '@nestjs/common';
import { PreviewEntityType } from '@prisma/client';
import { PreviewService } from './preview.service';

describe('PreviewService', () => {
  const prisma = {
    previewToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    page: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    blogPost: {
      findUnique: jest.fn(),
    },
    resource: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing or expired preview tokens', async () => {
    prisma.previewToken.findUnique.mockResolvedValueOnce(null);
    const service = new PreviewService(prisma as any);

    await expect(service.resolveToken('missing-token')).rejects.toThrow(
      NotFoundException,
    );

    prisma.previewToken.findUnique.mockResolvedValueOnce({
      token: 'expired-token',
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    });

    await expect(service.resolveToken('expired-token')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('resolves page preview data through the stored token entity', async () => {
    prisma.previewToken.findUnique.mockResolvedValue({
      token: 'valid-token',
      entityType: PreviewEntityType.PAGE,
      entityId: 'page-1',
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.page.findUnique.mockResolvedValue({ id: 'page-1' });

    const service = new PreviewService(prisma as any);

    await expect(service.getPreviewData('valid-token')).resolves.toEqual({
      id: 'page-1',
    });
    expect(prisma.page.findUnique).toHaveBeenCalledWith({
      where: { id: 'page-1' },
      include: {
        translations: true,
        blocks: { orderBy: { sortOrder: 'asc' } },
      },
    });
  });
});
