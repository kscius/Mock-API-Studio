// backend/src/shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { ValidationService } from './services/validation.service';

@Global()
@Module({
  providers: [ValidationService],
  exports: [ValidationService],
})
export class SharedModule {}

