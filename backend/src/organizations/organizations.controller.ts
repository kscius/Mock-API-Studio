import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { TeamsService } from './teams.service';
import { CommentsService } from './comments.service';
import { ChangeRequestsService } from './change-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin/organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.organizationsService.create({
      ...body,
      createdById: req.user.userId,
    });
  }

  @Get()
  async findAll(@Request() req) {
    return this.organizationsService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.organizationsService.findOne(id, req.user.userId);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.organizationsService.addMember(
      id,
      body.userId,
      req.user.userId,
      body.role,
    );
  }

  @Put(':id/members/:userId')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
    @Body() body: any,
  ) {
    return this.organizationsService.updateMemberRole(
      id,
      userId,
      req.user.userId,
      body.role,
    );
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req,
  ) {
    await this.organizationsService.removeMember(id, userId, req.user.userId);
    return { message: 'Member removed successfully' };
  }
}

@Controller('admin/teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.teamsService.create({
      ...body,
      createdById: req.user.userId,
    });
  }

  @Get()
  async findAll(@Body() body: { organizationId: string }) {
    return this.teamsService.findAll(body.organizationId);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() body: any) {
    return this.teamsService.addMember(id, body.userId, body.role);
  }

  @Delete(':id/members/:userId')
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    await this.teamsService.removeMember(id, userId);
    return { message: 'Member removed successfully' };
  }
}

@Controller('admin/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.commentsService.create({
      ...body,
      userId: req.user.userId,
    });
  }

  @Get(':entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.commentsService.findByEntity(entityType, entityId);
  }

  @Put(':id/resolve')
  async resolve(@Param('id') id: string, @Request() req) {
    return this.commentsService.resolve(id, req.user.userId);
  }
}

@Controller('admin/change-requests')
@UseGuards(JwtAuthGuard)
export class ChangeRequestsController {
  constructor(private readonly changeRequestsService: ChangeRequestsService) {}

  @Post()
  async create(@Request() req, @Body() body: any) {
    return this.changeRequestsService.create({
      ...body,
      createdById: req.user.userId,
    });
  }

  @Get()
  async findAll(@Body() body: { workspaceId: string; status?: any }) {
    return this.changeRequestsService.findAll(body.workspaceId, body.status);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.changeRequestsService.approve(id, req.user.userId, body.comment);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.changeRequestsService.reject(id, req.user.userId, body.comment);
  }
}

