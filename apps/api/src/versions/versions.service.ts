import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VersionEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VersionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createVersion(params: {
    entityType: VersionEntityType;
    entityId: string;
    snapshotJson: Prisma.InputJsonValue;
    createdById?: string;
    note?: string;
  }) {
    const lastVersion = await this.prisma.contentVersion.findFirst({
      where: {
        entityType: params.entityType,
        entityId: params.entityId,
      },
      orderBy: {
        versionNo: 'desc',
      },
    });

    const nextVersionNo = (lastVersion?.versionNo ?? 0) + 1;

    return this.prisma.contentVersion.create({
      data: {
        entityType: params.entityType,
        entityId: params.entityId,
        versionNo: nextVersionNo,
        snapshotJson: params.snapshotJson,
        createdById: params.createdById,
        note: params.note,
      },
    });
  }

  async listVersions(entityType: VersionEntityType, entityId: string) {
    return this.prisma.contentVersion.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        versionNo: 'desc',
      },
    });
  }

  async getVersion(versionId: string) {
    const version = await this.prisma.contentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version;
  }
}