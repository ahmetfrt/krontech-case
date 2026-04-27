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
import { Locale, PublishStatus } from '@prisma/client';

class CreateProductTranslationDto {
  @IsEnum(Locale)
  locale: Locale;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  longDescription?: string;

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

export class CreateProductDto {
  @IsString()
  productCode: string;

  @IsOptional()
  @IsString()
  heroImageId?: string | null;

  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ValidateIf(
    (dto: CreateProductDto) =>
      dto.status === PublishStatus.SCHEDULED || dto.scheduledAt !== undefined,
  )
  @IsISO8601()
  scheduledAt?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductTranslationDto)
  translations: CreateProductTranslationDto[];
}
