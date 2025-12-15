import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class VerifyProviderDto {
  @IsString()
  @IsNotEmpty()
  apiId: string;

  @IsString()
  @IsNotEmpty()
  contractId: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  providerBaseUrl: string;
}

