import { NotFoundException } from '@nestjs/common';
import { VersionEntityType } from '@prisma/client';
import { VersionsService } from './versions.service';

describe('VersionsService', () => {
  const prisma = {
    contentVersion: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates the next version number from the latest snapshot', async () => {
    prisma.contentVersion.findFirst.mockResolvedValue({ versionNo: 4 });
    prisma.contentVersion.create.mockResolvedValue({ id: 'version-5' });

    const service = new VersionsService(prisma as any);

    await service.createVersion({
      entityType: VersionEntityType.PAGE,
      entityId: 'page-1',
      snapshotJson: { title: 'Old title' },
      createdById: 'user-1',
      note: 'Before update',
    });

    expect(prisma.contentVersion.findFirst).toHaveBeenCalledWith({
      where: {
        entityType: VersionEntityType.PAGE,
        entityId: 'page-1',
      },
      orderBy: {
        versionNo: 'desc',
      },
    });
    expect(prisma.contentVersion.create).toHaveBeenCalledWith({
      data: {
        entityType: VersionEntityType.PAGE,
        entityId: 'page-1',
        versionNo: 5,
        snapshotJson: { title: 'Old title' },
        createdById: 'user-1',
        note: 'Before update',
      },
    });
  });

  it('throws when a requested version does not exist', async () => {
    prisma.contentVersion.findUnique.mockResolvedValue(null);
    const service = new VersionsService(prisma as any);

    await expect(service.getVersion('missing-version')).rejects.toThrow(
      NotFoundException,
    );
  });
});
