import { MediaService } from './media.service';

describe('MediaService', () => {
  const prisma = {
    mediaAsset: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };
  const minioService = {
    uploadObject: jest.fn(),
  };
  const auditService = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MINIO_BUCKET;
    delete process.env.MINIO_PUBLIC_URL;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uploads a file, stores metadata, returns public URL, and writes audit', async () => {
    process.env.MINIO_PUBLIC_URL = 'https://cdn.example.com/media/';
    jest.spyOn(Date, 'now').mockReturnValue(1714212000000);
    jest.spyOn(Math, 'random').mockReturnValue(0.123456);

    prisma.mediaAsset.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'asset-1',
        ...data,
      }),
    );

    const service = new MediaService(
      prisma as any,
      minioService as any,
      auditService as any,
    );

    const result = await service.upload(
      {
        originalname: 'diagram.png',
        mimetype: 'image/png',
        buffer: Buffer.from('image-bytes'),
      } as Express.Multer.File,
      'user-1',
    );

    expect(minioService.uploadObject).toHaveBeenCalledWith({
      key: expect.stringMatching(/^uploads\/1714212000000-.+\.png$/),
      body: Buffer.from('image-bytes'),
      contentType: 'image/png',
    });
    expect(prisma.mediaAsset.create).toHaveBeenCalledWith({
      data: {
        fileName: 'diagram.png',
        mimeType: 'image/png',
        storageKey: expect.stringMatching(/^uploads\/1714212000000-.+\.png$/),
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'asset-1',
        fileName: 'diagram.png',
        mimeType: 'image/png',
        publicUrl: expect.stringMatching(
          /^https:\/\/cdn\.example\.com\/media\/uploads\/1714212000000-.+\.png$/,
        ),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        action: 'MEDIA_UPLOAD',
        entityType: 'MEDIA_ASSET',
        entityId: 'asset-1',
      }),
    );
  });

  it('builds default bucket public URLs and preserves null media', () => {
    const service = new MediaService(
      prisma as any,
      minioService as any,
      auditService as any,
    );

    expect(service.withPublicUrl(null)).toBeNull();
    expect(service.withPublicUrl({ storageKey: 'uploads/file.pdf' })).toEqual({
      storageKey: 'uploads/file.pdf',
      publicUrl: 'http://localhost:9000/krontech-media/uploads/file.pdf',
    });
  });
});
