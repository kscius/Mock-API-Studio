import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { SamlService } from '../services/saml.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('saml')
export class SamlController {
  constructor(
    private prisma: PrismaService,
    private samlService: SamlService,
  ) {}

  // ========== SAML CONFIGURATION ==========

  @Post('workspace/:workspaceId/config')
  @UseGuards(JwtAuthGuard)
  async configureSaml(
    @Param('workspaceId') workspaceId: string,
    @Body() data: {
      entityId: string;
      ssoUrl: string;
      certificate: string;
      attributeMapping?: any;
    },
  ) {
    const config = await this.prisma.samlConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        entityId: data.entityId,
        ssoUrl: data.ssoUrl,
        certificate: data.certificate,
        attributeMapping: data.attributeMapping || {
          email: 'email',
          name: 'name',
          role: 'role',
        },
        isActive: true,
      },
      update: {
        entityId: data.entityId,
        ssoUrl: data.ssoUrl,
        certificate: data.certificate,
        attributeMapping: data.attributeMapping || {
          email: 'email',
          name: 'name',
          role: 'role',
        },
      },
    });

    return config;
  }

  @Get('workspace/:workspaceId/config')
  @UseGuards(JwtAuthGuard)
  async getSamlConfig(@Param('workspaceId') workspaceId: string) {
    const config = await this.prisma.samlConfig.findUnique({
      where: { workspaceId },
    });

    if (!config) {
      return null;
    }

    // Don't expose the full certificate in GET requests
    return {
      ...config,
      certificate: config.certificate ? '***' : null,
    };
  }

  @Delete('workspace/:workspaceId/config')
  @UseGuards(JwtAuthGuard)
  async deleteSamlConfig(@Param('workspaceId') workspaceId: string) {
    await this.prisma.samlConfig.delete({
      where: { workspaceId },
    });

    return { message: 'SAML configuration deleted' };
  }

  // ========== SAML METADATA ==========

  @Get('workspace/:workspaceId/metadata')
  async getSamlMetadata(
    @Param('workspaceId') workspaceId: string,
    @Res() res: Response,
  ) {
    const metadata = await this.samlService.getSamlMetadata(workspaceId);
    
    res.set('Content-Type', 'application/xml');
    res.send(metadata);
  }

  // Note: Actual SAML SSO flow requires passport-saml
  // These endpoints would be:
  // - GET /saml/login/:workspaceId (initiate SAML flow)
  // - POST /saml/callback/:workspaceId (handle SAML response)
}

