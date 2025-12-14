import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { BackupController } from './controllers/backup.controller';
import { BackupService } from './services/backup.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [WorkspacesController, BackupController],
  providers: [WorkspacesService, BackupService, RolesGuard],
  exports: [WorkspacesService, BackupService],
})
export class WorkspacesModule {}

