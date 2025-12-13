import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(private prisma: PrismaService) {}

  async sendNotification(
    workspaceId: string,
    event: string,
    message: SlackMessage,
  ): Promise<void> {
    try {
      const integration = await this.prisma.slackIntegration.findUnique({
        where: { workspaceId },
      });

      if (!integration || !integration.isActive) {
        this.logger.debug(`No active Slack integration for workspace ${workspaceId}`);
        return;
      }

      // Check if this event is enabled
      if (!integration.events.includes(event)) {
        this.logger.debug(`Event ${event} not enabled for workspace ${workspaceId}`);
        return;
      }

      // Send to Slack webhook
      const response = await fetch(integration.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        this.logger.error(
          `Failed to send Slack notification: ${response.status} ${response.statusText}`,
        );
      } else {
        this.logger.log(`Slack notification sent for event: ${event}`);
      }
    } catch (error) {
      this.logger.error('Error sending Slack notification:', error);
    }
  }

  // Helper methods for common notifications

  async notifyApiCreated(workspaceId: string, apiName: string, apiSlug: string) {
    await this.sendNotification(workspaceId, 'api.created', {
      text: `🎉 New API created: *${apiName}* (${apiSlug})`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎉 *New API Created*\n\nAPI: *${apiName}*\nSlug: \`${apiSlug}\``,
          },
        },
      ],
    });
  }

  async notifyApiDeleted(workspaceId: string, apiName: string) {
    await this.sendNotification(workspaceId, 'api.deleted', {
      text: `🗑️ API deleted: *${apiName}*`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🗑️ *API Deleted*\n\nAPI: *${apiName}*`,
          },
        },
      ],
    });
  }

  async notifyRateLimitExceeded(
    workspaceId: string,
    apiSlug: string,
    ip: string,
  ) {
    await this.sendNotification(workspaceId, 'rate_limit.exceeded', {
      text: `⚠️ Rate limit exceeded for API ${apiSlug} from IP ${ip}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `⚠️ *Rate Limit Exceeded*\n\nAPI: \`${apiSlug}\`\nIP: \`${ip}\``,
          },
        },
      ],
    });
  }

  async notifyHighTraffic(
    workspaceId: string,
    apiSlug: string,
    requestCount: number,
    timeWindow: string,
  ) {
    await this.sendNotification(workspaceId, 'high_traffic', {
      text: `📈 High traffic detected: ${requestCount} requests to ${apiSlug} in ${timeWindow}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📈 *High Traffic Alert*\n\nAPI: \`${apiSlug}\`\nRequests: *${requestCount}* in ${timeWindow}`,
          },
        },
      ],
    });
  }

  async notifyWebhookFailed(
    workspaceId: string,
    webhookUrl: string,
    error: string,
  ) {
    await this.sendNotification(workspaceId, 'webhook.failed', {
      text: `❌ Webhook delivery failed to ${webhookUrl}: ${error}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `❌ *Webhook Delivery Failed*\n\nURL: \`${webhookUrl}\`\nError: ${error}`,
          },
        },
      ],
    });
  }

  async notifyEndpointError(
    workspaceId: string,
    apiSlug: string,
    endpoint: string,
    errorCount: number,
  ) {
    await this.sendNotification(workspaceId, 'endpoint.errors', {
      text: `🔴 ${errorCount} errors on endpoint ${endpoint} (${apiSlug})`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔴 *Endpoint Errors*\n\nAPI: \`${apiSlug}\`\nEndpoint: \`${endpoint}\`\nErrors: *${errorCount}*`,
          },
        },
      ],
    });
  }
}

