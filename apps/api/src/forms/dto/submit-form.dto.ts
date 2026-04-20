import { IsBoolean, IsEnum, IsObject } from 'class-validator';
import { Locale } from '@prisma/client';

export class SubmitFormDto {
  @IsEnum(Locale)
  locale: Locale;

  @IsObject()
  payloadJson: Record<string, any>;

  @IsBoolean()
  consentGiven: boolean;
}