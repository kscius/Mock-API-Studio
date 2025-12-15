import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Verifier } from '@pact-foundation/pact';
import * as path from 'path';
import * as fs from 'fs';

interface PactContract {
  consumer: { name: string };
  provider: { name: string };
  interactions: PactInteraction[];
  metadata: {
    pactSpecification: { version: string };
  };
}

interface PactInteraction {
  description: string;
  providerState?: string;
  request: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

interface ContractValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingEndpoints: string[];
  mismatchedResponses: Array<{
    endpoint: string;
    expected: any;
    actual: any;
    differences: string[];
  }>;
}

@Injectable()
export class ContractTestingService {
  private readonly logger = new Logger(ContractTestingService.name);
  private readonly pactDirectory = path.join(process.cwd(), 'pacts');

  constructor(private prisma: PrismaService) {
    // Ensure pact directory exists
    if (!fs.existsSync(this.pactDirectory)) {
      fs.mkdirSync(this.pactDirectory, { recursive: true });
    }
  }

  /**
   * Upload and store a Pact contract file
   */
  async uploadContract(
    apiId: string,
    contractContent: string,
  ): Promise<{ contractId: string; consumer: string; provider: string }> {
    try {
      const contract: PactContract = JSON.parse(contractContent);

      // Validate contract format
      if (!contract.consumer || !contract.provider || !contract.interactions) {
        throw new BadRequestException('Invalid Pact contract format');
      }

      // Verify API exists
      const api = await this.prisma.apiDefinition.findUnique({
        where: { id: apiId },
      });

      if (!api) {
        throw new NotFoundException(`API with ID ${apiId} not found`);
      }

      // Generate contract ID
      const contractId = `${contract.consumer.name}-${contract.provider.name}-${Date.now()}`;
      const contractPath = path.join(this.pactDirectory, `${contractId}.json`);

      // Save contract file
      fs.writeFileSync(contractPath, contractContent, 'utf-8');

      this.logger.log(
        `Contract uploaded: ${contract.consumer.name} -> ${contract.provider.name}`,
      );

      return {
        contractId,
        consumer: contract.consumer.name,
        provider: contract.provider.name,
      };
    } catch (error) {
      this.logger.error('Error uploading contract', error.stack);
      throw new BadRequestException(`Failed to upload contract: ${error.message}`);
    }
  }

  /**
   * Validate API endpoints against a Pact contract
   */
  async validateContract(
    apiId: string,
    contractId: string,
  ): Promise<ContractValidationResult> {
    const contractPath = path.join(this.pactDirectory, `${contractId}.json`);

    if (!fs.existsSync(contractPath)) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const contract: PactContract = JSON.parse(
      fs.readFileSync(contractPath, 'utf-8'),
    );

    // Load API endpoints
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      throw new NotFoundException(`API with ID ${apiId} not found`);
    }

    const result: ContractValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      missingEndpoints: [],
      mismatchedResponses: [],
    };

    // Validate each interaction
    for (const interaction of contract.interactions) {
      const { request, response } = interaction;

      // Find matching endpoint
      const endpoint = api.endpoints.find(
        (ep) =>
          ep.method === request.method &&
          this.pathsMatch(ep.path, request.path),
      );

      if (!endpoint) {
        result.missingEndpoints.push(
          `${request.method} ${request.path}`,
        );
        result.errors.push(
          `Missing endpoint: ${request.method} ${request.path}`,
        );
        result.valid = false;
        continue;
      }

      // Validate response
      const responses = endpoint.responses as any[];
      const matchingResponse = responses.find(
        (r) => r.status === response.status,
      );

      if (!matchingResponse) {
        result.errors.push(
          `${request.method} ${request.path}: No response with status ${response.status}`,
        );
        result.valid = false;
        continue;
      }

      // Deep compare response bodies
      const differences = this.compareObjects(
        response.body,
        matchingResponse.body,
      );

      if (differences.length > 0) {
        result.mismatchedResponses.push({
          endpoint: `${request.method} ${request.path}`,
          expected: response.body,
          actual: matchingResponse.body,
          differences,
        });
        result.warnings.push(
          `${request.method} ${request.path}: Response body mismatch`,
        );
      }
    }

    this.logger.log(
      `Contract validation ${result.valid ? 'passed' : 'failed'}: ${result.errors.length} errors, ${result.warnings.length} warnings`,
    );

    return result;
  }

  /**
   * Run Pact provider verification
   */
  async verifyProvider(
    apiId: string,
    contractId: string,
    providerBaseUrl: string,
  ): Promise<{ success: boolean; message: string; details?: any }> {
    const contractPath = path.join(this.pactDirectory, `${contractId}.json`);

    if (!fs.existsSync(contractPath)) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const contract: PactContract = JSON.parse(
      fs.readFileSync(contractPath, 'utf-8'),
    );

    try {
      // Configure Pact Verifier
      const verifier = new Verifier({
        provider: contract.provider.name,
        providerBaseUrl: providerBaseUrl,
        pactUrls: [contractPath],
        logLevel: 'info',
        timeout: 30000,
      });

      // Run verification
      const output = await verifier.verifyProvider();

      this.logger.log(`Provider verification successful for ${contract.provider.name}`);

      return {
        success: true,
        message: 'Provider verification passed',
        details: output,
      };
    } catch (error) {
      this.logger.error('Provider verification failed', error.stack);
      return {
        success: false,
        message: 'Provider verification failed',
        details: error.message,
      };
    }
  }

  /**
   * Generate Pact contract from API endpoints
   */
  async generateContract(
    apiId: string,
    consumerName: string,
  ): Promise<PactContract> {
    const api = await this.prisma.apiDefinition.findUnique({
      where: { id: apiId },
      include: { endpoints: true },
    });

    if (!api) {
      throw new NotFoundException(`API with ID ${apiId} not found`);
    }

    const interactions: PactInteraction[] = [];

    for (const endpoint of api.endpoints) {
      if (!endpoint.enabled) continue;

      const responses = endpoint.responses as any[];
      const defaultResponse = responses.find((r) => r.isDefault) || responses[0];

      if (!defaultResponse) continue;

      interactions.push({
        description: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
        request: {
          method: endpoint.method,
          path: endpoint.path,
          headers: {},
        },
        response: {
          status: defaultResponse.status,
          headers: defaultResponse.headers || {},
          body: defaultResponse.body,
        },
      });
    }

    const contract: PactContract = {
      consumer: { name: consumerName },
      provider: { name: api.name },
      interactions,
      metadata: {
        pactSpecification: { version: '2.0.0' },
      },
    };

    this.logger.log(
      `Generated contract with ${interactions.length} interactions`,
    );

    return contract;
  }

  /**
   * List all contracts
   */
  async listContracts(): Promise<
    Array<{
      contractId: string;
      consumer: string;
      provider: string;
      interactions: number;
    }>
  > {
    const contracts: Array<any> = [];

    if (!fs.existsSync(this.pactDirectory)) {
      return contracts;
    }

    const files = fs.readdirSync(this.pactDirectory);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const contractPath = path.join(this.pactDirectory, file);
      const contract: PactContract = JSON.parse(
        fs.readFileSync(contractPath, 'utf-8'),
      );

      contracts.push({
        contractId: file.replace('.json', ''),
        consumer: contract.consumer.name,
        provider: contract.provider.name,
        interactions: contract.interactions.length,
      });
    }

    return contracts;
  }

  /**
   * Check if two paths match (considering path parameters)
   */
  private pathsMatch(template: string, actual: string): boolean {
    const templateParts = template.split('/');
    const actualParts = actual.split('/');

    if (templateParts.length !== actualParts.length) {
      return false;
    }

    for (let i = 0; i < templateParts.length; i++) {
      const templatePart = templateParts[i];
      const actualPart = actualParts[i];

      // Skip path parameters
      if (templatePart.startsWith(':') || templatePart.startsWith('{')) {
        continue;
      }

      if (templatePart !== actualPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * Deep compare two objects and return differences
   */
  private compareObjects(expected: any, actual: any, path = ''): string[] {
    const differences: string[] = [];

    if (typeof expected !== typeof actual) {
      differences.push(
        `${path || 'root'}: Type mismatch (expected ${typeof expected}, got ${typeof actual})`,
      );
      return differences;
    }

    if (expected === null || actual === null) {
      if (expected !== actual) {
        differences.push(`${path || 'root'}: Value mismatch`);
      }
      return differences;
    }

    if (typeof expected === 'object') {
      const expectedKeys = Object.keys(expected);
      const actualKeys = Object.keys(actual);

      // Check for missing keys
      for (const key of expectedKeys) {
        if (!(key in actual)) {
          differences.push(`${path}.${key}: Missing in actual`);
        } else {
          differences.push(
            ...this.compareObjects(
              expected[key],
              actual[key],
              `${path}.${key}`,
            ),
          );
        }
      }

      // Check for extra keys
      for (const key of actualKeys) {
        if (!(key in expected)) {
          differences.push(`${path}.${key}: Extra key in actual`);
        }
      }
    } else if (expected !== actual) {
      differences.push(
        `${path || 'root'}: Value mismatch (expected ${expected}, got ${actual})`,
      );
    }

    return differences;
  }
}

