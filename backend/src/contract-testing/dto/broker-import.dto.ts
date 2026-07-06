import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BrokerImportDto {
  @IsString()
  @IsNotEmpty()
  apiId: string;

  @IsString()
  @IsNotEmpty()
  consumer: string;

  @IsString()
  @IsNotEmpty()
  provider: string;

  @IsString()
  @IsOptional()
  version?: string;
}
