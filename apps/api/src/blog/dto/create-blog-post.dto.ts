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

class CreateBlogPostTranslationDto {
  @IsEnum(Locale)
  locale: Locale;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  content?: string;

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

export class CreateBlogPostDto {
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

  @ValidateIf(
    (dto: CreateBlogPostDto) =>
      dto.status === PublishStatus.SCHEDULED || dto.scheduledAt !== undefined,
  )
  @IsISO8601()
  scheduledAt?: string | null;

  @IsOptional()
  @IsString()
  featuredImageId?: string | null;

  @IsOptional()
  @IsString()
  authorName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlogPostTranslationDto)
  translations: CreateBlogPostTranslationDto[];
}
