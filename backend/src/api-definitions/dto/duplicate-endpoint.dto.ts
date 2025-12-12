// backend/src/api-definitions/dto/duplicate-endpoint.dto.ts
import { IsString, IsOptional, IsIn } from 'class-validator';

export class DuplicateEndpointDto {
  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])
  method?: string;

  @IsString()
  @IsOptional()
  summary?: string;
}

