import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePreviewTokenDto } from './dto/create-preview-token.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class PreviewService {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(dto: CreatePreviewTokenDto) {
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    return this.prisma.previewToken.create({
      data: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        token,
        expiresAt,
      },
    });
  }

  async resolveToken(token: string) {
    const previewToken = await this.prisma.previewToken.findUnique({
      where: { token },
    });

    if (!previewToken || previewToken.expiresAt < new Date()) {
      throw new NotFoundException('Preview token not found or expired');
    }

    return previewToken;
  }

  async getPreviewData(token: string) {
    const previewToken = await this.resolveToken(token);

    switch (previewToken.entityType) {
      case 'PAGE':
        return this.prisma.page.findUnique({
          where: { id: previewToken.entityId },
          include: {
            translations: true,
            blocks: { orderBy: { sortOrder: 'asc' } },
          },
        });

      case 'PRODUCT':
        return this.prisma.product.findUnique({
          where: { id: previewToken.entityId },
          include: { translations: true },
        });

      case 'BLOG_POST':
        return this.prisma.blogPost.findUnique({
          where: { id: previewToken.entityId },
          include: { translations: true },
        });

      case 'RESOURCE':
        return this.prisma.resource.findUnique({
          where: { id: previewToken.entityId },
          include: { translations: true },
        });

      default:
        throw new NotFoundException('Unsupported preview entity');
    }
  }
}