import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateWebhookDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  apiId?: string;

  @IsString()
  targetUrl: string;

  @IsString()
  @IsIn(['mock.request.received', 'mock.response.sent'])
  eventType: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  secret?: string;
}

