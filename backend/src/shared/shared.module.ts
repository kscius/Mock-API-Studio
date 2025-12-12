// backend/src/shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { ValidationService } from './services/validation.service';
import { FakerTemplatingService } from './faker-templating.service';
import { FakerDocsController } from './faker-docs.controller';

@Global()
@Module({
  providers: [ValidationService, FakerTemplatingService],
  controllers: [FakerDocsController],
  exports: [ValidationService, FakerTemplatingService],
})
export class SharedModule {}

