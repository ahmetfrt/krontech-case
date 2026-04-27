import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT') ?? 'localhost';
    const port = this.configService.get<string>('MINIO_PORT') ?? '9000';
    const accessKeyId =
      this.configService.get<string>('MINIO_ROOT_USER') ?? 'minioadmin';
    const secretAccessKey =
      this.configService.get<string>('MINIO_ROOT_PASSWORD') ?? 'minioadmin';
    const useSSL =
      (this.configService.get<string>('MINIO_USE_SSL') ?? 'false') === 'true';

    this.bucket =
      this.configService.get<string>('MINIO_BUCKET') ?? 'krontech-media';

    this.client = new S3Client({
      region: 'us-east-1',
      endpoint: `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );
    } catch {
      await this.client.send(
        new CreateBucketCommand({
          Bucket: this.bucket,
        }),
      );
    }

    await this.ensurePublicReadPolicy();
  }

  async uploadObject(params: {
    key: string;
    body: Buffer;
    contentType: string;
  }) {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );

    return {
      bucket: this.bucket,
      key: params.key,
    };
  }

  private async ensurePublicReadPolicy() {
    await this.client.send(
      new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        }),
      }),
    );
  }
}
