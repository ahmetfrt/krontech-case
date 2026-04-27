import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType, FormType } from '@prisma/client';

class CreateFormFieldDto {
  @IsString()
  name: string;

  @IsString()
  label: string;

  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsInt()
  sortOrder: number;

  @IsOptional()
  optionsJson?: unknown;
}

export class CreateFormDto {
  @IsString()
  name: string;

  @IsEnum(FormType)
  formType: FormType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  successMessage?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldDto)
  fields: CreateFormFieldDto[];
}
