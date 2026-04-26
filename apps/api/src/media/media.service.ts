import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from './minio.service';

type MediaAssetWithStorageKey = {
  storageKey: string;
};

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

    const item = await this.prisma.mediaAsset.create({
      data: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        storageKey,
      },
    });

    return this.withPublicUrl(item);
  }

  async findAll() {
    const items = await this.prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return items.map((item) => this.withPublicUrl(item));
  }

  async findOne(id: string) {
    const item = await this.prisma.mediaAsset.findUnique({
      where: { id },
    });

    if (!item) return null;

    return this.withPublicUrl(item);
  }

  withPublicUrl<T extends MediaAssetWithStorageKey | null | undefined>(
    item: T,
  ): T extends MediaAssetWithStorageKey
    ? T & { publicUrl: string }
    : null {
    if (!item) {
      return null as T extends MediaAssetWithStorageKey
        ? T & { publicUrl: string }
        : null;
    }

    return {
      ...item,
      publicUrl: this.buildPublicUrl(item.storageKey),
    } as T extends MediaAssetWithStorageKey ? T & { publicUrl: string } : null;
  }

  private buildPublicUrl(storageKey: string) {
    const bucket = process.env.MINIO_BUCKET ?? 'krontech-media';
    const baseUrl =
      process.env.MINIO_PUBLIC_URL?.replace(/\/$/, '') ??
      `http://localhost:9000/${bucket}`;

    return `${baseUrl}/${storageKey}`;
  }
}
