import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateContractDto {
  @IsString()
  @IsNotEmpty()
  apiId: string;

  @IsString()
  @IsNotEmpty()
  contractId: string;
}

