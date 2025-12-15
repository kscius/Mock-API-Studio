import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class RecordRequestDto {
  @IsString()
  @IsNotEmpty()
  method: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsObject()
  query?: Record<string, any>;

  @IsOptional()
  body?: any;
}

