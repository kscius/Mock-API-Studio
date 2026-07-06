import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface BrokerPactSummary {
  consumer: string;
  provider: string;
  version: string;
  createdAt?: string;
}

@Injectable()
export class PactBrokerService {
  private readonly logger = new Logger(PactBrokerService.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('PACT_BROKER_BASE_URL'));
  }

  getStatus(): { configured: boolean; baseUrl: string | null } {
    const baseUrl = this.config.get<string>('PACT_BROKER_BASE_URL') ?? null;
    return { configured: Boolean(baseUrl), baseUrl };
  }

  async listPacts(providerName: string): Promise<BrokerPactSummary[]> {
    const data = await this.brokerRequest<{
      _embedded?: {
        pacts?: Array<{
          consumer?: { name: string };
          provider?: { name: string };
          version?: { number: string; createdAt?: string };
        }>;
      };
    }>(`/pacts/provider/${encodeURIComponent(providerName)}`);

    const pacts = data._embedded?.pacts ?? [];
    return pacts.map((pact) => ({
      consumer: pact.consumer?.name ?? 'unknown',
      provider: pact.provider?.name ?? providerName,
      version: pact.version?.number ?? 'unknown',
      createdAt: pact.version?.createdAt,
    }));
  }

  async fetchPact(
    consumer: string,
    provider: string,
    version: string,
  ): Promise<string> {
    const data = await this.brokerRequest<{ interactions?: unknown[] }>(
      `/pacts/provider/${encodeURIComponent(provider)}/consumer/${encodeURIComponent(consumer)}/version/${encodeURIComponent(version)}`,
      { acceptJson: true },
    );
    return JSON.stringify(data, null, 2);
  }

  async publishPact(
    contractContent: string,
    version: string,
  ): Promise<{ consumer: string; provider: string; version: string }> {
    let contract: {
      consumer: { name: string };
      provider: { name: string };
    };
    try {
      contract = JSON.parse(contractContent);
    } catch {
      throw new BadRequestException('Invalid Pact contract JSON');
    }

    const consumer = contract.consumer?.name;
    const provider = contract.provider?.name;
    if (!consumer || !provider) {
      throw new BadRequestException('Contract must include consumer and provider names');
    }

    await this.brokerRequest(
      `/pacts/provider/${encodeURIComponent(provider)}/consumer/${encodeURIComponent(consumer)}/version/${encodeURIComponent(version)}`,
      {
        method: 'PUT',
        body: contractContent,
        contentType: 'application/json',
      },
    );

    this.logger.log(`Published pact ${consumer} -> ${provider}@${version}`);
    return { consumer, provider, version };
  }

  private async brokerRequest<T>(
    path: string,
    options: {
      method?: string;
      body?: string;
      contentType?: string;
      acceptJson?: boolean;
    } = {},
  ): Promise<T> {
    const baseUrl = this.config.get<string>('PACT_BROKER_BASE_URL');
    if (!baseUrl) {
      throw new BadRequestException(
        'Pact Broker is not configured. Set PACT_BROKER_BASE_URL in environment.',
      );
    }

    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const headers: Record<string, string> = {
      ...this.authHeaders(),
      Accept: options.acceptJson
        ? 'application/json'
        : 'application/hal+json, application/json',
    };
    if (options.contentType) {
      headers['Content-Type'] = options.contentType;
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        headers,
        body: options.body,
      });
    } catch (error) {
      this.logger.error(`Pact Broker request failed: ${url}`, error);
      throw new ServiceUnavailableException('Unable to reach Pact Broker');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new BadRequestException(
        `Pact Broker error (${response.status}): ${text || response.statusText}`,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  private authHeaders(): Record<string, string> {
    const token = this.config.get<string>('PACT_BROKER_TOKEN');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }

    const username = this.config.get<string>('PACT_BROKER_USERNAME');
    const password = this.config.get<string>('PACT_BROKER_PASSWORD');
    if (username && password) {
      const encoded = Buffer.from(`${username}:${password}`).toString('base64');
      return { Authorization: `Basic ${encoded}` };
    }

    return {};
  }
}
