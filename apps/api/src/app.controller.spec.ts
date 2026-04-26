import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    prismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return database health status', async () => {
      await expect(appController.health()).resolves.toEqual({
        ok: true,
        database: 'connected',
      });
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });
  });
});
