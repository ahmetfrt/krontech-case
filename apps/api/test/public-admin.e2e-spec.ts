import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FormType } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { FormsService } from '../src/forms/forms.service';
import { PublicFormsController } from '../src/forms/public-forms.controller';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedirectsController } from '../src/redirects/redirects.controller';

describe('public and admin HTTP flows (e2e)', () => {
  let app: INestApplication<App>;
  const formsService = {
    getPublicFormByType: jest.fn(),
    submit: jest.fn(),
  };
  const prismaService = {
    redirectRule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    formsService.getPublicFormByType.mockResolvedValue({
      id: 'form-1',
      formType: FormType.CONTACT,
      fields: [],
    });
    formsService.submit.mockResolvedValue({ id: 'submission-1' });
    prismaService.redirectRule.findMany.mockResolvedValue([]);
    prismaService.redirectRule.create.mockResolvedValue({
      id: 'redirect-1',
      sourcePath: '/old',
      targetPath: '/new',
      statusCode: 301,
      isActive: true,
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PublicFormsController, RedirectsController],
      providers: [
        { provide: FormsService, useValue: formsService },
        { provide: PrismaService, useValue: prismaService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('serves active public form definitions by type', async () => {
    await request(app.getHttpServer())
      .get('/public/forms/type/CONTACT')
      .expect(200)
      .expect((response) => {
        expect(response.body.id).toBe('form-1');
      });

    expect(formsService.getPublicFormByType).toHaveBeenCalledWith(
      FormType.CONTACT,
    );
  });

  it('submits public form payloads', async () => {
    await request(app.getHttpServer())
      .post('/public/forms/form-1/submit')
      .send({
        locale: 'TR',
        payloadJson: { email: 'lead@example.com' },
        consentGiven: true,
      })
      .expect(201)
      .expect({ id: 'submission-1' });

    expect(formsService.submit).toHaveBeenCalledWith('form-1', {
      locale: 'TR',
      payloadJson: { email: 'lead@example.com' },
      consentGiven: true,
    });
  });

  it('serves admin redirect CRUD routes when guards allow access', async () => {
    await request(app.getHttpServer()).get('/redirects').expect(200).expect([]);

    await request(app.getHttpServer())
      .post('/redirects')
      .send({
        sourcePath: '/old',
        targetPath: '/new',
        statusCode: 301,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBe('redirect-1');
      });
  });
});
