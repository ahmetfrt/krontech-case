import { RedirectsController } from './redirects.controller';

describe('RedirectsController', () => {
  const prisma = {
    redirectRule: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists redirect rules for admin UI', async () => {
    prisma.redirectRule.findMany.mockResolvedValue([]);
    const controller = new RedirectsController(prisma as never);

    await expect(controller.findAll()).resolves.toEqual([]);
    expect(prisma.redirectRule.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
  });

  it('creates redirect rule payloads', async () => {
    const created = {
      id: 'rule-1',
      sourcePath: '/old',
      targetPath: '/new',
      statusCode: 301,
      isActive: true,
    };
    prisma.redirectRule.create.mockResolvedValue(created);
    const controller = new RedirectsController(prisma as never);

    await expect(
      controller.create({
        sourcePath: '/old',
        targetPath: '/new',
        statusCode: 301,
      }),
    ).resolves.toEqual(created);
    expect(prisma.redirectRule.create).toHaveBeenCalledWith({
      data: {
        sourcePath: '/old',
        targetPath: '/new',
        statusCode: 301,
        isActive: true,
      },
    });
  });

  it('updates and deletes redirect rules', async () => {
    prisma.redirectRule.update.mockResolvedValue({ id: 'rule-1' });
    prisma.redirectRule.delete.mockResolvedValue({ id: 'rule-1' });
    const controller = new RedirectsController(prisma as never);

    await expect(
      controller.update('rule-1', { targetPath: '/next' }),
    ).resolves.toEqual({ id: 'rule-1' });
    await expect(controller.delete('rule-1')).resolves.toEqual({ id: 'rule-1' });
  });
});
