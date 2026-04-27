import { AuditService } from './audit.service';

describe('AuditService', () => {
  const prisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('writes user-scoped audit logs', async () => {
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
    const service = new AuditService(prisma as any);

    await service.log({
      userId: 'user-1',
      action: 'CONTENT_PUBLISH',
      entityType: 'PRODUCT',
      entityId: 'product-1',
      metaJson: { trigger: 'manual' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'CONTENT_PUBLISH',
        entityType: 'PRODUCT',
        entityId: 'product-1',
        metaJson: { trigger: 'manual' },
      },
    });
  });

  it('skips writes when no authenticated user id is available', async () => {
    const service = new AuditService(prisma as any);

    const result = await service.log({
      action: 'CONTENT_UPDATE',
      entityType: 'PAGE',
      entityId: 'page-1',
    });

    expect(result).toBeNull();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('bounds recent audit log queries', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);
    const service = new AuditService(prisma as any);

    await service.findRecent(999);
    await service.findRecent(Number.NaN);

    expect(prisma.auditLog.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ take: 200 }),
    );
    expect(prisma.auditLog.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ take: 100 }),
    );
  });
});
