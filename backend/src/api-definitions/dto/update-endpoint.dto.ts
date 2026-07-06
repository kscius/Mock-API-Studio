// backend/src/api-definitions/dto/update-endpoint.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsObject, IsIn } from 'class-validator';

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
  @IsIn(['REST', 'GRAPHQL', 'GRPC'])
  type?: string;

  @IsString()
  @IsOptional()
  @IsIn(['query', 'mutation', 'subscription', 'unary', 'server_streaming', 'client_streaming', 'bidi_streaming'])
  operationType?: string;

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

