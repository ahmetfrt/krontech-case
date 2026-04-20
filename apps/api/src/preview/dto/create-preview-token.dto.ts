import { IsEnum, IsString } from 'class-validator';
import { PreviewEntityType } from '@prisma/client';

export class CreatePreviewTokenDto {
  @IsEnum(PreviewEntityType)
  entityType: PreviewEntityType;

  @IsString()
  entityId: string;
}