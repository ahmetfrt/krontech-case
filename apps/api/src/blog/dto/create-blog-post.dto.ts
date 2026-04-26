import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
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
}

export class CreateBlogPostDto {
  @IsOptional()
  @IsEnum(PublishStatus)
  status?: PublishStatus;

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
