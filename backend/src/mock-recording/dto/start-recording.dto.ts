import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class StartRecordingDto {
  @IsString()
  @IsNotEmpty()
  apiId: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  targetUrl: string;
}

