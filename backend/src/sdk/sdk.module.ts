import { Module } from '@nestjs/common';
import { SdkController } from './sdk.controller';
import { ApiDefinitionsModule } from '../api-definitions/api-definitions.module';
import { OpenApiModule } from '../openapi/openapi.module';

@Module({
  imports: [ApiDefinitionsModule, OpenApiModule],
  controllers: [SdkController],
})
export class SdkModule {}
