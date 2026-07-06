// backend/src/api-definitions/dto/update-endpoint.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsObject } from 'class-validator';

export class UpdateEndpointDto {
  @IsString()
  @IsOptional()
  method?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsObject()
  @IsOptional()
  requestSchema?: any;

  @IsArray()
  @IsOptional()
  responses?: any[];

  @IsNumber()
  @IsOptional()
  delayMs?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsString()
  @IsOptional()
  sequenceMode?: string;

  @IsBoolean()
  @IsOptional()
  chaosEnabled?: boolean;

  @IsObject()
  @IsOptional()
  chaosConfig?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  stateEnabled?: boolean;
}

