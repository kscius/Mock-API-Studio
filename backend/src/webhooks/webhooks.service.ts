import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

interface WebhookPayload {
  event: string;
  timestamp: string;
  workspaceId?: string;
  apiSlug?: string;
  endpoint?: {
    id: string;
    method: string;
    path: string;
  };
  request?: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    query?: any;
    body?: any;
  };
  response?: {
    statusCode: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async findAll(workspaceId?: string) {
    return this.prisma.webhookSubscription.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.webhookSubscription.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateWebhookDto) {
    return this.prisma.webhookSubscription.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateWebhookDto) {
    return this.prisma.webhookSubscription.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.webhookSubscription.delete({
      where: { id },
    });
  }

  /**
   * Fire webhooks for a specific event
   */
  async fireWebhooks(eventType: string, payload: WebhookPayload) {
    // Find active webhooks for this event
    const webhooks = await this.prisma.webhookSubscription.findMany({
      where: {
        eventType,
        isActive: true,
        // Optionally filter by workspaceId if provided in payload
        ...(payload.workspaceId ? { workspaceId: payload.workspaceId } : {}),
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    // Fire webhooks async without blocking
    webhooks.forEach((webhook) => {
      this.sendWebhookWithRetry(webhook.targetUrl, payload, webhook.secret).catch((error) => {
        this.logger.error(
          `Failed to send webhook to ${webhook.targetUrl} after retries: ${error.message}`,
        );
      });
    });
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWebhookWithRetry(
    url: string,
    payload: WebhookPayload,
    secret?: string,
  ): Promise<void> {
    const maxAttempts = this.config.webhookRetryAttempts;
    const baseDelay = this.config.webhookRetryDelayMs;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.sendWebhook(url, payload, secret);
        return; // Success, exit retry loop
      } catch (error: any) {
        if (attempt === maxAttempts) {
          this.logger.error(
            `Webhook failed after ${maxAttempts} attempts to ${url}: ${error.message}`,
          );
          throw error;
        }

        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Webhook attempt ${attempt}/${maxAttempts} failed to ${url}. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Send HTTP POST to webhook URL
   */
  private async sendWebhook(
    url: string,
    payload: WebhookPayload,
    secret?: string,
  ): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add secret as header if provided
    if (secret) {
      headers['X-Webhook-Secret'] = secret;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    this.logger.log(`Webhook sent successfully to ${url}`);
  }
}

