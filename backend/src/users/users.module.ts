import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { DataExportService } from './services/data-export.service';

@Module({
  providers: [DataExportService],
  controllers: [UsersController],
  exports: [DataExportService],
})
export class UsersModule {}

