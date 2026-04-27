import { Locale, PublishStatus } from '@prisma/client';
import { BlogService } from './blog.service';

describe('BlogService', () => {
  const prisma = {
    blogPost: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const versionsService = {
    createVersion: jest.fn(),
  };
  const cacheService = {
    delByPrefix: jest.fn(),
  };
  const revalidateService = {
    revalidatePath: jest.fn(),
  };
  const mediaService = {
    withPublicUrl: jest.fn((item) => item ?? null),
  };
  const auditService = {
    log: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('publishes posts, clears scheduled time, purges cache, revalidates list/detail pages, and audits', async () => {
    const post = {
      id: 'post-1',
      status: PublishStatus.SCHEDULED,
      authorName: 'Security Team',
      featuredImage: null,
      translations: [
        { locale: Locale.TR, slug: 'pam-yazisi' },
        { locale: Locale.EN, slug: 'pam-article' },
      ],
    };
    prisma.blogPost.findUnique.mockResolvedValue(post);
    prisma.blogPost.update.mockResolvedValue({
      ...post,
      status: PublishStatus.PUBLISHED,
      publishedAt: new Date('2026-04-27T10:00:00.000Z'),
    });

    const service = new BlogService(
      prisma as any,
      versionsService as any,
      cacheService as any,
      revalidateService as any,
      mediaService as any,
      auditService as any,
    );

    await service.publish('post-1', 'user-1');

    expect(prisma.blogPost.update).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      data: expect.objectContaining({
        status: PublishStatus.PUBLISHED,
        publishedAt: expect.any(Date),
        scheduledAt: null,
      }),
      include: {
        translations: true,
        featuredImage: true,
      },
    });
    expect(cacheService.delByPrefix).toHaveBeenCalledWith('blog:');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith('/tr/blog');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/tr/blog/pam-yazisi',
    );
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith('/en/blog');
    expect(revalidateService.revalidatePath).toHaveBeenCalledWith(
      '/en/blog/pam-article',
    );
    expect(auditService.log).toHaveBeenCalledWith({
      userId: 'user-1',
      action: 'CONTENT_PUBLISH',
      entityType: 'BLOG_POST',
      entityId: 'post-1',
      metaJson: {
        trigger: 'manual',
      },
    });
  });
});
