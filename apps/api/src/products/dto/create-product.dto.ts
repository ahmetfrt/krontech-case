import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductTranslationDto)
  translations: CreateProductTranslationDto[];
}
