import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFormDto } from './dto/create-form.dto';
import { SubmitFormDto } from './dto/submit-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { BadRequestException } from '@nestjs/common';

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
      include: { fields: true },
    });

    if (!form || !form.isActive) {
      throw new NotFoundException('Active form not found');
    }

    if (dto.honeypot && dto.honeypot.trim() !== '') {
      throw new BadRequestException('Spam detected');
    }

    const submission = await this.prisma.formSubmission.create({
      data: {
        formDefinitionId: formId,
        locale: dto.locale,
        payloadJson: dto.payloadJson,
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
}