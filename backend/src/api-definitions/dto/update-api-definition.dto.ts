// backend/src/api-definitions/dto/update-api-definition.dto.ts
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateApiDefinitionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsString()
  @IsOptional()
  basePath?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  tags?: string[];
}

