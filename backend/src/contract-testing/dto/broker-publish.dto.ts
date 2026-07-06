import { IsNotEmpty, IsString } from 'class-validator';

export class BrokerPublishDto {
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsString()
  @IsNotEmpty()
  version: string;
}
