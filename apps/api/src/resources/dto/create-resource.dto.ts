import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Locale, PublishStatus, ResourceType } from '@prisma/client';

class CreateResourceTranslationDto {
  @IsEnum(Locale)
  locale: Locale;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  seoTitle?: string;

  @IsOptional()
  @IsString()
  seoDescription?: string;

  @IsOptional()
  @IsString()
  ogTitle?: string;

  @IsOptional()
  @IsString()
  ogDescription?: string;

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @IsBoolean()
  robotsIndex?: boolean;

  @IsOptional()
  @IsBoolean()
  robotsFollow?: boolean;

  @IsOptional()
  structuredDataJson?: unknown;
}

export class CreateResourceDto {
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @IsOptional()
  @IsString()
  fileId?: string | null;

  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ValidateIf(
    (dto: CreateResourceDto) =>
      dto.status === PublishStatus.SCHEDULED || dto.scheduledAt !== undefined,
  )
  @IsISO8601()
  scheduledAt?: string | null;

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResourceTranslationDto)
  translations: CreateResourceTranslationDto[];
}
