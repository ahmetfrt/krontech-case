import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditAction =
  | 'CONTENT_CREATE'
  | 'CONTENT_UPDATE'
  | 'CONTENT_PUBLISH'
  | 'CONTENT_RESTORE'
  | 'FORM_CREATE'
  | 'FORM_UPDATE'
  | 'MEDIA_UPLOAD';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    action: AuditAction;
    entityId?: string;
    entityType: string;
    metaJson?: Prisma.InputJsonValue;
    userId?: string;
  }) {
    if (!params.userId) {
      return null;
    }

    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metaJson: params.metaJson,
      },
    });
  }

  async findRecent(take = 100) {
    const safeTake = Number.isFinite(take) ? take : 100;

    return this.prisma.auditLog.findMany({
      take: Math.min(Math.max(safeTake, 1), 200),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }
}
