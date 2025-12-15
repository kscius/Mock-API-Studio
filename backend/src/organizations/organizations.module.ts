import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { TeamsService } from './teams.service';
import { CommentsService } from './comments.service';
import { ChangeRequestsService } from './change-requests.service';
import { OrganizationsController } from './organizations.controller';
import { TeamsController } from './teams.controller';
import { CommentsController } from './comments.controller';
import { ChangeRequestsController } from './change-requests.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    OrganizationsController,
    TeamsController,
    CommentsController,
    ChangeRequestsController,
  ],
  providers: [
    OrganizationsService,
    TeamsService,
    CommentsService,
    ChangeRequestsService,
  ],
  exports: [
    OrganizationsService,
    TeamsService,
    CommentsService,
    ChangeRequestsService,
  ],
})
export class OrganizationsModule {}

