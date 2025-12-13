import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('integrations/slack')
@UseGuards(JwtAuthGuard)
export class SlackIntegrationsController {
  constructor(private prisma: PrismaService) {}

  @Get('workspace/:workspaceId')
  async getIntegration(@Param('workspaceId') workspaceId: string) {
    const integration = await this.prisma.slackIntegration.findUnique({
      where: { workspaceId },
    });

    return integration;
  }

  @Post('workspace/:workspaceId')
  async createOrUpdateIntegration(
    @Param('workspaceId') workspaceId: string,
    @Body() data: { webhookUrl: string; events: string[]; isActive: boolean },
  ) {
    const integration = await this.prisma.slackIntegration.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        webhookUrl: data.webhookUrl,
        events: data.events,
        isActive: data.isActive,
      },
      update: {
        webhookUrl: data.webhookUrl,
        events: data.events,
        isActive: data.isActive,
      },
    });

    return integration;
  }

  @Delete('workspace/:workspaceId')
  async deleteIntegration(@Param('workspaceId') workspaceId: string) {
    await this.prisma.slackIntegration.delete({
      where: { workspaceId },
    });

    return { message: 'Slack integration deleted successfully' };
  }
}

