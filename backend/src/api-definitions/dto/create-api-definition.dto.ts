// backend/src/api-definitions/dto/create-api-definition.dto.ts
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateApiDefinitionDto {
  @IsString()
  workspaceId: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

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

