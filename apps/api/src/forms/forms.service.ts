import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FieldType, FormType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

type FormFieldForValidation = {
  fieldType: FieldType;
  isRequired: boolean;
  label: string;
  name: string;
  optionsJson: Prisma.JsonValue | null;
};

@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFormDto) {
    return this.prisma.formDefinition.create({
      data: {
        name: dto.name,
        formType: dto.formType,
        isActive: dto.isActive ?? true,
        successMessage: dto.successMessage,
        webhookUrl: dto.webhookUrl,
        fields: {
          create: dto.fields.map((field) => ({
            name: field.name,
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired ?? false,
            sortOrder: field.sortOrder,
            optionsJson: field.optionsJson ?? undefined,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.formDefinition.findMany({
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const form = await this.prisma.formDefinition.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return form;
  }

  async update(id: string, dto: UpdateFormDto) {
    await this.findOne(id);

    if (dto.fields) {
      await this.prisma.formField.deleteMany({
        where: { formDefinitionId: id },
      });
    }

    return this.prisma.formDefinition.update({
      where: { id },
      data: {
        name: dto.name,
        formType: dto.formType,
        isActive: dto.isActive,
        successMessage: dto.successMessage,
        webhookUrl: dto.webhookUrl,
        fields: dto.fields
          ? {
              create: dto.fields.map((field) => ({
                name: field.name,
                label: field.label,
                fieldType: field.fieldType,
                isRequired: field.isRequired ?? false,
                sortOrder: field.sortOrder,
                optionsJson: field.optionsJson ?? undefined,
              })),
            }
          : undefined,
      },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async submit(formId: string, dto: SubmitFormDto) {
    const form = await this.prisma.formDefinition.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!form || !form.isActive) {
      throw new NotFoundException('Active form not found');
    }

    if (dto.honeypot && dto.honeypot.trim() !== '') {
      throw new BadRequestException('Spam detected');
    }

    const payloadJson = this.validateSubmissionPayload(
      form.fields,
      dto.payloadJson,
      dto.consentGiven,
    );

    const submission = await this.prisma.formSubmission.create({
      data: {
        formDefinitionId: formId,
        locale: dto.locale,
        payloadJson: payloadJson as Prisma.InputJsonValue,
        consentGiven: dto.consentGiven,
      },
    });

    if (form.webhookUrl) {
      fetch(form.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId,
          formName: form.name,
          submission,
        }),
      }).catch(() => {
        // webhook failure should not break form submission
      });
    }

    return submission;
  }

  async getSubmissions(formId: string) {
    const form = await this.prisma.formDefinition.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    return this.prisma.formSubmission.findMany({
      where: { formDefinitionId: formId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPublicForm(formId: string) {
    const form = await this.prisma.formDefinition.findUnique({
      where: { id: formId },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!form || !form.isActive) {
      throw new NotFoundException('Active form not found');
    }

    return form;
  }

  async getPublicFormByType(formType: FormType) {
    const form = await this.prisma.formDefinition.findFirst({
      where: {
        formType,
        isActive: true,
      },
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!form) {
      throw new NotFoundException('Active form not found');
    }

    return form;
  }

  async exportSubmissionsCsv(formId: string) {
    const submissions = await this.getSubmissions(formId);

    const headers = ['id', 'locale', 'consentGiven', 'createdAt', 'payloadJson'];
    const rows = submissions.map((submission) => [
      submission.id,
      submission.locale,
      String(submission.consentGiven),
      submission.createdAt.toISOString(),
      JSON.stringify(submission.payloadJson).replace(/"/g, '""'),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell)}"`).join(','),
      ),
    ].join('\n');

    return csv;
  }

  private validateSubmissionPayload(
    fields: FormFieldForValidation[],
    payload: Record<string, unknown>,
    consentGiven: boolean,
  ) {
    if (!consentGiven) {
      throw new BadRequestException('Consent is required');
    }

    const allowedNames = new Set(fields.map((field) => field.name));
    const sanitizedPayload: Record<string, unknown> = {};

    for (const key of Object.keys(payload)) {
      if (!allowedNames.has(key)) {
        throw new BadRequestException(`Unknown field: ${key}`);
      }
    }

    for (const field of fields) {
      const value = payload[field.name];

      if (this.isEmptyValue(value)) {
        if (field.isRequired) {
          throw new BadRequestException(`${field.label} is required`);
        }

        continue;
      }

      sanitizedPayload[field.name] = this.validateFieldValue(field, value);
    }

    return sanitizedPayload;
  }

  private validateFieldValue(
    field: FormFieldForValidation,
    value: unknown,
  ): unknown {
    if (field.fieldType === FieldType.CHECKBOX) {
      if (typeof value !== 'boolean') {
        throw new BadRequestException(`${field.label} must be true or false`);
      }

      if (field.isRequired && value !== true) {
        throw new BadRequestException(`${field.label} is required`);
      }

      return value;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`${field.label} must be a string`);
    }

    const trimmedValue = value.trim();

    if (field.fieldType === FieldType.EMAIL && !this.isEmail(trimmedValue)) {
      throw new BadRequestException(`${field.label} must be a valid email`);
    }

    if (field.fieldType === FieldType.SELECT) {
      const options = this.readSelectOptions(field.optionsJson);

      if (options.length > 0 && !options.includes(trimmedValue)) {
        throw new BadRequestException(`${field.label} is not a valid option`);
      }
    }

    return trimmedValue;
  }

  private isEmptyValue(value: unknown) {
    return (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (typeof value === 'boolean' && value === false)
    );
  }

  private isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private readSelectOptions(optionsJson: Prisma.JsonValue | null) {
    if (Array.isArray(optionsJson)) {
      return optionsJson.filter(
        (option): option is string =>
          typeof option === 'string' && option.trim().length > 0,
      );
    }

    if (
      typeof optionsJson === 'object' &&
      optionsJson !== null &&
      'options' in optionsJson &&
      Array.isArray(optionsJson.options)
    ) {
      return optionsJson.options.filter(
        (option): option is string =>
          typeof option === 'string' && option.trim().length > 0,
      );
    }

    return [];
  }
}
