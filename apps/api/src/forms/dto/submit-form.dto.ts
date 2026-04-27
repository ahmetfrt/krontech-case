import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { Locale } from '@prisma/client';

export class SubmitFormDto {
  @IsEnum(Locale)
  locale: Locale;

  @IsObject()
  payloadJson: Record<string, unknown>;

  @IsBoolean()
  consentGiven: boolean;

  @IsOptional()
  @IsString()
  honeypot?: string;
}
