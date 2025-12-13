import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, RolesGuard],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}

