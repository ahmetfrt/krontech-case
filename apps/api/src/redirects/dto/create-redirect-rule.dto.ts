import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateRedirectRuleDto {
  @IsString()
  sourcePath: string;

  @IsString()
  targetPath: string;

  @IsInt()
  @Min(300)
  @Max(399)
  statusCode: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
