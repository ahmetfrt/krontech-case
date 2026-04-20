import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PublishingService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/30 * * * * *')
  async publishScheduledContent() {
    const now = new Date();

    await this.prisma.page.updateMany({
      where: {
        status: PublishStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: now,
      },
    });

    await this.prisma.product.updateMany({
      where: {
        status: PublishStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: now,
      },
    });

    await this.prisma.blogPost.updateMany({
      where: {
        status: PublishStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: now,
      },
    });

    await this.prisma.resource.updateMany({
      where: {
        status: PublishStatus.SCHEDULED,
        scheduledAt: { lte: now },
      },
      data: {
        status: PublishStatus.PUBLISHED,
        publishedAt: now,
      },
    });
  }
}