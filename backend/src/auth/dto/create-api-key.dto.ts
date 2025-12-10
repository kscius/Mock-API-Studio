// backend/src/auth/dto/create-api-key.dto.ts
import { IsArray, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scope?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

