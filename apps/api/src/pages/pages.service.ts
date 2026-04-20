import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePageDto, userId?: string) {
    return this.prisma.page.create({
      data: {
        pageType: dto.pageType,
        status: dto.status ?? PublishStatus.DRAFT,
        createdById: userId,
        updatedById: userId,
        translations: {
          create: dto.translations,
        },
        blocks: {
          create: dto.blocks.map((block) => ({
            type: block.type,
            sortOrder: block.sortOrder,
            configJson: block.configJson as Prisma.InputJsonValue,
          })),
        },
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.page.findMany({
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const page = await this.prisma.page.findUnique({
      where: { id },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async update(id: string, dto: UpdatePageDto, userId?: string) {
    await this.findOne(id);

    if (dto.translations || dto.blocks) {
      await this.prisma.pageTranslation.deleteMany({ where: { pageId: id } });
      await this.prisma.pageBlock.deleteMany({ where: { pageId: id } });
    }

    return this.prisma.page.update({
      where: { id },
      data: {
        pageType: dto.pageType,
        status: dto.status,
        updatedById: userId,
        translations: dto.translations
          ? {
              create: dto.translations,
            }
          : undefined,
        blocks: dto.blocks
          ? {
              create: dto.blocks.map((block) => ({
                type: block.type,
                sortOrder: block.sortOrder,
                configJson: block.configJson as Prisma.InputJsonValue,
              })),
            }
          : undefined,
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async publish(id: string, userId?: string) {
    await this.findOne(id);

    return this.prisma.page.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
        updatedById: userId,
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const page = await this.prisma.page.findFirst({
      where: {
        status: 'PUBLISHED',
        translations: {
          some: {
            locale: locale as any,
            slug,
          },
        },
      },
      include: {
        translations: true,
        blocks: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!page) {
      throw new NotFoundException('Published page not found');
    }

    return page;
  }
}