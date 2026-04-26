import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
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

  @IsOptional()
  @IsString()
  externalUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResourceTranslationDto)
  translations: CreateResourceTranslationDto[];
}
