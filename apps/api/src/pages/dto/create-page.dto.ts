import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Locale, PageType, PublishStatus } from '@prisma/client';

class CreatePageTranslationDto {
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

class CreatePageBlockDto {
  @IsString()
  type: string;

  @IsInt()
  sortOrder: number;

  @IsOptional()
  configJson: unknown;
}

export class CreatePageDto {
  @IsEnum(PageType)
  pageType: PageType;

  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ValidateIf(
    (dto: CreatePageDto) =>
      dto.status === PublishStatus.SCHEDULED || dto.scheduledAt !== undefined,
  )
  @IsISO8601()
  scheduledAt?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePageTranslationDto)
  translations: CreatePageTranslationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePageBlockDto)
  blocks: CreatePageBlockDto[];
}
