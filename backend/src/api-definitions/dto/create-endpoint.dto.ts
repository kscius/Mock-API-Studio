// backend/src/api-definitions/dto/create-endpoint.dto.ts
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsObject, IsIn } from 'class-validator';

export class CreateEndpointDto {
  @IsString()
  method: string;

  @IsString()
  path: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsObject()
  @IsOptional()
  requestSchema?: any;

  @IsArray()
  responses: any[];

  @IsNumber()
  @IsOptional()
  delayMs?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  // GraphQL fields
  @IsString()
  @IsOptional()
  @IsIn(['REST', 'GRAPHQL'])
  type?: string;

  @IsString()
  @IsOptional()
  operationName?: string;

  @IsString()
  @IsOptional()
  @IsIn(['query', 'mutation', 'subscription'])
  operationType?: string;
}

