import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface WorkspaceBackup {
  version: string;
  timestamp: string;
  workspace: any;
  apiDefinitions: any[];
  endpoints: any[];
  members: any[];
  webhookSubscriptions: any[];
  websocketEndpoints: any[];
  slackIntegration: any;
  samlConfig: any;
  customDomain: any;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly BACKUP_VERSION = '1.0.0';

  constructor(private prisma: PrismaService) {}

  async createBackup(workspaceId: string): Promise<WorkspaceBackup> {
    try {
      this.logger.log(`Creating backup for workspace ${workspaceId}`);

      // Get workspace
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new NotFoundException('Workspace not found');
      }

      // Get all related data
      const [
        apiDefinitions,
        members,
        webhookSubscriptions,
        websocketEndpoints,
        slackIntegration,
        samlConfig,
        customDomain,
      ] = await Promise.all([
        this.prisma.apiDefinition.findMany({
          where: { workspaceId },
          include: { endpoints: true },
        }),
        this.prisma.workspaceMember.findMany({
          where: { workspaceId },
          include: { user: { select: { email: true, name: true } } },
        }),
        this.prisma.webhookSubscription.findMany({
          where: { workspaceId },
        }),
        this.prisma.webSocketEndpoint.findMany({
          where: { api: { workspaceId } },
        }),
        this.prisma.slackIntegration.findUnique({
          where: { workspaceId },
        }),
        this.prisma.samlConfig.findUnique({
          where: { workspaceId },
        }),
        this.prisma.customDomain.findUnique({
          where: { workspaceId },
        }),
      ]);

      // Flatten endpoints from API definitions
      const endpoints = apiDefinitions.flatMap((api) => 
        (api.endpoints || []).map(ep => ({
          ...ep,
          apiSlug: api.slug,
        }))
      );

      // Remove endpoints from API definitions to avoid duplication
      const apisWithoutEndpoints = apiDefinitions.map(({ endpoints, ...api }) => api);

      const backup: WorkspaceBackup = {
        version: this.BACKUP_VERSION,
        timestamp: new Date().toISOString(),
        workspace,
        apiDefinitions: apisWithoutEndpoints,
        endpoints,
        members,
        webhookSubscriptions: webhookSubscriptions || [],
        websocketEndpoints: websocketEndpoints || [],
        slackIntegration,
        samlConfig,
        customDomain,
      };

      this.logger.log(`Backup created successfully for workspace ${workspaceId}`);

      return backup;
    } catch (error) {
      this.logger.error(`Failed to create backup: ${error.message}`);
      throw error;
    }
  }

  async restoreBackup(
    workspaceId: string,
    backup: WorkspaceBackup,
    options: { overwrite?: boolean } = {},
  ): Promise<void> {
    try {
      this.logger.log(`Restoring backup for workspace ${workspaceId}`);

      // Verify backup version
      if (backup.version !== this.BACKUP_VERSION) {
        throw new Error(`Incompatible backup version: ${backup.version}`);
      }

      // Use transaction for atomicity
      await this.prisma.$transaction(async (tx) => {
        // If overwrite, delete existing data
        if (options.overwrite) {
          await tx.apiDefinition.deleteMany({ where: { workspaceId } });
          await tx.workspaceMember.deleteMany({ where: { workspaceId } });
          await tx.webhookSubscription.deleteMany({ where: { workspaceId } });

          // Delete integrations
          await tx.slackIntegration.deleteMany({ where: { workspaceId } });
          await tx.samlConfig.deleteMany({ where: { workspaceId } });
          await tx.customDomain.deleteMany({ where: { workspaceId } });
        }

        // Update workspace settings
        await tx.workspace.update({
          where: { id: workspaceId },
          data: {
            name: backup.workspace.name,
            description: backup.workspace.description,
            logoUrl: backup.workspace.logoUrl,
            primaryColor: backup.workspace.primaryColor,
            secondaryColor: backup.workspace.secondaryColor,
            footerText: backup.workspace.footerText,
          },
        });

        // Restore API definitions
        for (const api of backup.apiDefinitions) {
          const { id, createdAt, updatedAt, ...apiData } = api;
          
          await tx.apiDefinition.create({
            data: {
              ...apiData,
              workspaceId,
            },
          });
        }

        // Restore endpoints
        const apiIdMap = new Map<string, string>();
        const restoredApis = await tx.apiDefinition.findMany({
          where: { workspaceId },
        });

        for (const api of restoredApis) {
          const originalApi = backup.apiDefinitions.find(a => a.slug === api.slug);
          if (originalApi) {
            apiIdMap.set(originalApi.id, api.id);
          }
        }

        for (const endpoint of backup.endpoints) {
          const { id, createdAt, updatedAt, apiId, ...endpointData } = endpoint;
          const newApiId = apiIdMap.get(apiId);

          if (newApiId) {
            await tx.apiEndpoint.create({
              data: {
                ...endpointData,
                apiId: newApiId,
              },
            });
          }
        }

        // Restore webhook subscriptions
        for (const webhook of backup.webhookSubscriptions) {
          const { id, createdAt, updatedAt, ...webhookData } = webhook;
          
          await tx.webhookSubscription.create({
            data: {
              ...webhookData,
              workspaceId,
            },
          });
        }

        // Restore WebSocket endpoints
        for (const wsEndpoint of backup.websocketEndpoints) {
          const { id, createdAt, updatedAt, apiId, ...wsData } = wsEndpoint;
          const newApiId = apiIdMap.get(apiId);

          if (newApiId) {
            await tx.webSocketEndpoint.create({
              data: {
                ...wsData,
                apiId: newApiId,
              },
            });
          }
        }

        // Restore Slack integration
        if (backup.slackIntegration) {
          const { id, createdAt, updatedAt, ...slackData } = backup.slackIntegration;
          
          await tx.slackIntegration.upsert({
            where: { workspaceId },
            create: { ...slackData, workspaceId },
            update: slackData,
          });
        }

        // Restore SAML config
        if (backup.samlConfig) {
          const { id, createdAt, updatedAt, ...samlData } = backup.samlConfig;
          
          await tx.samlConfig.upsert({
            where: { workspaceId },
            create: { ...samlData, workspaceId },
            update: samlData,
          });
        }

        // Restore custom domain
        if (backup.customDomain) {
          const { id, createdAt, updatedAt, ...domainData } = backup.customDomain;
          
          await tx.customDomain.upsert({
            where: { workspaceId },
            create: { ...domainData, workspaceId },
            update: domainData,
          });
        }
      });

      this.logger.log(`Backup restored successfully for workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error(`Failed to restore backup: ${error.message}`);
      throw error;
    }
  }
}

