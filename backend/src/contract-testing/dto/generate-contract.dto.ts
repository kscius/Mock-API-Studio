import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateContractDto {
  @IsString()
  @IsNotEmpty()
  apiId: string;

  @IsString()
  @IsNotEmpty()
  consumerName: string;
}

