import { IsNotEmpty, IsString } from 'class-validator';

export class BrokerListDto {
  @IsString()
  @IsNotEmpty()
  provider: string;
}
