import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  targetUrl?: string;

  @IsOptional()
  @IsString()
  @IsIn(['mock.request.received', 'mock.response.sent'])
  eventType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  secret?: string;
}

