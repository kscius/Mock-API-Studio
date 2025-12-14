import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

// Note: For full SAML implementation, install: npm install passport-saml @types/passport-saml
// This is a simplified version showing the structure

interface SamlProfile {
  issuer: string;
  sessionIndex: string;
  nameID: string;
  nameIDFormat: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

@Injectable()
export class SamlService {
  private readonly logger = new Logger(SamlService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async handleSamlLogin(
    workspaceId: string,
    profile: SamlProfile,
  ): Promise<{ user: any; token: string }> {
    try {
      // Get SAML configuration for workspace
      const samlConfig = await this.prisma.samlConfig.findUnique({
        where: { workspaceId },
      });

      if (!samlConfig || !samlConfig.isActive) {
        throw new BadRequestException('SAML not configured for this workspace');
      }

      // Map SAML attributes to user fields
      const attributeMapping = samlConfig.attributeMapping as any;
      const email = this.extractAttribute(profile, attributeMapping.email || 'email');
      const name = this.extractAttribute(profile, attributeMapping.name || 'name');
      const samlRole = this.extractAttribute(profile, attributeMapping.role || 'role');

      if (!email) {
        throw new BadRequestException('Email not provided by SAML provider');
      }

      // Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            name: name || email.split('@')[0],
            password: '', // SSO users don't have passwords
            isEmailVerified: true,
          },
        });
      }

      // Check if user is a member of the workspace
      const membership = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: user.id,
          },
        },
      });

      // Auto-add user to workspace if not a member
      if (!membership) {
        const role = this.mapSamlRoleToAppRole(samlRole);
        await this.prisma.workspaceMember.create({
          data: {
            workspaceId,
            userId: user.id,
            role,
          },
        });
      }

      // Generate JWT token
      const token = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.name,
        workspaceId,
      });

      this.logger.log(`SAML login successful for ${email} in workspace ${workspaceId}`);

      return { user, token };
    } catch (error) {
      this.logger.error(`SAML login failed: ${error.message}`);
      throw error;
    }
  }

  async getSamlMetadata(workspaceId: string): Promise<string> {
    const samlConfig = await this.prisma.samlConfig.findUnique({
      where: { workspaceId },
    });

    if (!samlConfig) {
      throw new BadRequestException('SAML not configured');
    }

    // Generate SAML metadata XML
    const metadata = `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${samlConfig.entityId}">
  <SPSSODescriptor AuthnRequestsSigned="false"
                   WantAssertionsSigned="false"
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                             Location="${samlConfig.ssoUrl}/callback"
                             index="1"/>
  </SPSSODescriptor>
</EntityDescriptor>`;

    return metadata;
  }

  private extractAttribute(profile: SamlProfile, attributeName: string): string | undefined {
    // Try direct access
    if (profile[attributeName]) {
      return Array.isArray(profile[attributeName]) 
        ? profile[attributeName][0] 
        : profile[attributeName];
    }

    // Try nested attributes
    if (profile.attributes && profile.attributes[attributeName]) {
      const value = profile.attributes[attributeName];
      return Array.isArray(value) ? value[0] : value;
    }

    return undefined;
  }

  private mapSamlRoleToAppRole(samlRole: string | undefined): any {
    if (!samlRole) {
      return 'VIEWER'; // Default role
    }

    const roleLower = samlRole.toLowerCase();

    if (roleLower.includes('admin') || roleLower.includes('owner')) {
      return 'ADMIN';
    }

    if (roleLower.includes('editor') || roleLower.includes('contributor')) {
      return 'EDITOR';
    }

    return 'VIEWER';
  }
}

