import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface UserDataExport {
  version: string;
  exportDate: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };
  workspaceMemberships: any[];
  apiKeys: any[];
  auditLogs: any[];
  createdApis: any[];
  createdEndpoints: any[];
}

@Injectable()
export class DataExportService {
  private readonly logger = new Logger(DataExportService.name);

  constructor(private prisma: PrismaService) {}

  async exportUserData(userId: string): Promise<UserDataExport> {
    try {
      this.logger.log(`Exporting data for user ${userId}`);

      // Get user
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get all user data
      const [
        workspaceMemberships,
        apiKeys,
        auditLogs,
      ] = await Promise.all([
        this.prisma.workspaceMember.findMany({
          where: { userId },
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        this.prisma.apiKey.findMany({
          where: { userId },
          select: {
            id: true,
            name: true,
            scopes: true,
            isActive: true,
            lastUsedAt: true,
            expiresAt: true,
            createdAt: true,
            // Don't export the actual key hash
          },
        }),
        this.prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1000, // Limit to last 1000 audit logs
        }),
      ]);

      // Get APIs created by user (via audit logs)
      const createdApis = await this.prisma.apiDefinition.findMany({
        where: {
          workspace: {
            members: {
              some: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          version: true,
          description: true,
          createdAt: true,
          workspace: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      // Get endpoints in user's workspaces
      const createdEndpoints = await this.prisma.apiEndpoint.findMany({
        where: {
          api: {
            workspace: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
        select: {
          id: true,
          method: true,
          path: true,
          summary: true,
          createdAt: true,
          api: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      });

      const exportData: UserDataExport = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        user,
        workspaceMemberships,
        apiKeys,
        auditLogs,
        createdApis,
        createdEndpoints,
      };

      this.logger.log(`Data export completed for user ${userId}`);

      return exportData;
    } catch (error) {
      this.logger.error(`Failed to export user data: ${error.message}`);
      throw error;
    }
  }

  async exportUserDataAsCsv(userId: string): Promise<string> {
    const data = await this.exportUserData(userId);

    // Convert to CSV format
    const lines: string[] = [];

    // User info
    lines.push('=== USER INFORMATION ===');
    lines.push(`ID,Email,Name,Role,Created At`);
    lines.push(`${data.user.id},${data.user.email},${data.user.name || 'N/A'},${data.user.role},${data.user.createdAt}`);
    lines.push('');

    // Workspace memberships
    lines.push('=== WORKSPACE MEMBERSHIPS ===');
    lines.push(`Workspace Name,Workspace Slug,Role,Joined At`);
    data.workspaceMemberships.forEach(m => {
      lines.push(`${m.workspace.name},${m.workspace.slug},${m.role},${m.createdAt}`);
    });
    lines.push('');

    // API Keys
    lines.push('=== API KEYS ===');
    lines.push(`Name,Scopes,Active,Last Used,Expires,Created At`);
    data.apiKeys.forEach(k => {
      lines.push(`${k.name},"${k.scopes.join(', ')}",${k.isActive},${k.lastUsedAt || 'Never'},${k.expiresAt || 'Never'},${k.createdAt}`);
    });
    lines.push('');

    // Audit Logs
    lines.push('=== AUDIT LOGS (Last 1000) ===');
    lines.push(`Action,Entity Type,Entity ID,Created At`);
    data.auditLogs.forEach(log => {
      lines.push(`${log.action},${log.entityType},${log.entityId},${log.createdAt}`);
    });

    return lines.join('\n');
  }
}

