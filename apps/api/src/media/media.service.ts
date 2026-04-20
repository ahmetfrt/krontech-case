import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from './minio.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly minioService: MinioService,
  ) {}

  async upload(file: Express.Multer.File) {
    const extension = file.originalname.includes('.')
      ? file.originalname.split('.').pop()
      : '';
    const storageKey = `uploads/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}${extension ? `.${extension}` : ''}`;

    await this.minioService.uploadObject({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    return this.prisma.mediaAsset.create({
      data: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        storageKey,
      },
    });
  }

  async findAll() {
    return this.prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}