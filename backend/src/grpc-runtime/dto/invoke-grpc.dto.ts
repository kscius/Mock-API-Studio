import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class InvokeGrpcDto {
  @IsString()
  @IsNotEmpty()
  service: string;

  @IsString()
  @IsNotEmpty()
  method: string;

  @IsObject()
  @IsOptional()
  input?: Record<string, unknown>;
}
