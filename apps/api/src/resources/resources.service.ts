import { Injectable, NotFoundException } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateResourceDto) {
    return this.prisma.resource.create({
      data: {
        resourceType: dto.resourceType,
        status: dto.status ?? PublishStatus.DRAFT,
        externalUrl: dto.externalUrl,
        translations: {
          create: dto.translations,
        },
      },
      include: {
        translations: true,
      },
    });
  }

  async findAll() {
    return this.prisma.resource.findMany({
      include: {
        translations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
      include: {
        translations: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async update(id: string, dto: UpdateResourceDto) {
    await this.findOne(id);

    if (dto.translations) {
      await this.prisma.resourceTranslation.deleteMany({
        where: { resourceId: id },
      });
    }

    return this.prisma.resource.update({
      where: { id },
      data: {
        resourceType: dto.resourceType,
        status: dto.status,
        externalUrl: dto.externalUrl,
        translations: dto.translations
          ? {
              create: dto.translations,
            }
          : undefined,
      },
      include: {
        translations: true,
      },
    });
  }

  async publish(id: string) {
    await this.findOne(id);

    return this.prisma.resource.update({
      where: { id },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        translations: true,
      },
    });
  }

  async findPublishedList(locale: string) {
    return this.prisma.resource.findMany({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: locale as any,
          },
        },
      },
      include: {
        translations: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findPublishedByLocaleAndSlug(locale: string, slug: string) {
    const resource = await this.prisma.resource.findFirst({
      where: {
        status: PublishStatus.PUBLISHED,
        translations: {
          some: {
            locale: locale as any,
            slug,
          },
        },
      },
      include: {
        translations: true,
      },
    });

    if (!resource) {
      throw new NotFoundException('Published resource not found');
    }

    return resource;
  }
}