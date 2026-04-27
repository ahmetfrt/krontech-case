import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FieldType, FormType, Locale } from '@prisma/client';
import { FormsService } from './forms.service';

describe('FormsService', () => {
  const prisma = {
    formDefinition: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    formField: {
      deleteMany: jest.fn(),
    },
    formSubmission: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const auditService = {
    log: jest.fn(),
  };

  const activeContactForm = {
    id: 'form-1',
    name: 'Contact',
    formType: FormType.CONTACT,
    isActive: true,
    webhookUrl: null,
    fields: [
      {
        name: 'firstName',
        label: 'First name',
        fieldType: FieldType.TEXT,
        isRequired: true,
        optionsJson: null,
      },
      {
        name: 'email',
        label: 'Email',
        fieldType: FieldType.EMAIL,
        isRequired: true,
        optionsJson: null,
      },
      {
        name: 'topic',
        label: 'Topic',
        fieldType: FieldType.SELECT,
        isRequired: true,
        optionsJson: { options: ['Sales', 'Support'] },
      },
      {
        name: 'consent',
        label: 'Consent',
        fieldType: FieldType.CHECKBOX,
        isRequired: true,
        optionsJson: null,
      },
      {
        name: 'phone',
        label: 'Phone',
        fieldType: FieldType.PHONE,
        isRequired: false,
        optionsJson: null,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.formDefinition.findUnique.mockResolvedValue(activeContactForm);
    prisma.formSubmission.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'submission-1',
        createdAt: new Date('2026-04-27T10:00:00.000Z'),
        ...data,
      }),
    );
  });

  it('sanitizes allowed submit payload fields and creates a submission', async () => {
    const service = new FormsService(prisma as any, auditService as any);

    const submission = await service.submit('form-1', {
      locale: Locale.TR,
      consentGiven: true,
      payloadJson: {
        firstName: '  Ada  ',
        email: '  ada@example.com ',
        topic: 'Sales',
        consent: true,
        phone: '   ',
      },
    });

    expect(submission).toEqual(
      expect.objectContaining({
        id: 'submission-1',
        formDefinitionId: 'form-1',
        locale: Locale.TR,
        consentGiven: true,
        payloadJson: {
          firstName: 'Ada',
          email: 'ada@example.com',
          topic: 'Sales',
          consent: true,
        },
      }),
    );
    expect(prisma.formSubmission.create).toHaveBeenCalledWith({
      data: {
        formDefinitionId: 'form-1',
        locale: Locale.TR,
        consentGiven: true,
        payloadJson: {
          firstName: 'Ada',
          email: 'ada@example.com',
          topic: 'Sales',
          consent: true,
        },
      },
    });
  });

  it('rejects inactive or missing forms', async () => {
    prisma.formDefinition.findUnique.mockResolvedValue(null);
    const service = new FormsService(prisma as any, auditService as any);

    await expect(
      service.submit('missing-form', {
        locale: Locale.TR,
        consentGiven: true,
        payloadJson: {},
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects honeypot submissions before writing', async () => {
    const service = new FormsService(prisma as any, auditService as any);

    await expect(
      service.submit('form-1', {
        locale: Locale.TR,
        consentGiven: true,
        honeypot: 'bot-value',
        payloadJson: {},
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.formSubmission.create).not.toHaveBeenCalled();
  });

  it('rejects unknown payload fields', async () => {
    const service = new FormsService(prisma as any, auditService as any);

    await expect(
      service.submit('form-1', {
        locale: Locale.TR,
        consentGiven: true,
        payloadJson: {
          firstName: 'Ada',
          email: 'ada@example.com',
          topic: 'Sales',
          consent: true,
          injected: 'nope',
        },
      }),
    ).rejects.toThrow('Unknown field: injected');
  });

  it('rejects invalid email and select option values', async () => {
    const service = new FormsService(prisma as any, auditService as any);

    await expect(
      service.submit('form-1', {
        locale: Locale.TR,
        consentGiven: true,
        payloadJson: {
          firstName: 'Ada',
          email: 'not-an-email',
          topic: 'Sales',
          consent: true,
        },
      }),
    ).rejects.toThrow('Email must be a valid email');

    await expect(
      service.submit('form-1', {
        locale: Locale.TR,
        consentGiven: true,
        payloadJson: {
          firstName: 'Ada',
          email: 'ada@example.com',
          topic: 'Finance',
          consent: true,
        },
      }),
    ).rejects.toThrow('Topic is not a valid option');
  });

  it('requires top-level consent and required checkbox consent', async () => {
    const service = new FormsService(prisma as any, auditService as any);

    await expect(
      service.submit('form-1', {
        locale: Locale.TR,
        consentGiven: false,
        payloadJson: {
          firstName: 'Ada',
          email: 'ada@example.com',
          topic: 'Sales',
          consent: true,
        },
      }),
    ).rejects.toThrow('Consent is required');

    await expect(
      service.submit('form-1', {
        locale: Locale.TR,
        consentGiven: true,
        payloadJson: {
          firstName: 'Ada',
          email: 'ada@example.com',
          topic: 'Sales',
          consent: false,
        },
      }),
    ).rejects.toThrow('Consent is required');
  });

  it('returns the newest active public form by type', async () => {
    prisma.formDefinition.findFirst.mockResolvedValue(activeContactForm);
    const service = new FormsService(prisma as any, auditService as any);

    await expect(service.getPublicFormByType(FormType.CONTACT)).resolves.toBe(
      activeContactForm,
    );
    expect(prisma.formDefinition.findFirst).toHaveBeenCalledWith({
      where: {
        formType: FormType.CONTACT,
        isActive: true,
      },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  });
});
