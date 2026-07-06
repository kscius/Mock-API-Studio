import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PactBrokerService } from './pact-broker.service';

describe('PactBrokerService', () => {
  let service: PactBrokerService;

  const mockConfig = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        PACT_BROKER_BASE_URL: 'https://broker.example.com',
        PACT_BROKER_TOKEN: 'test-token',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PactBrokerService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(PactBrokerService);
  });

  it('reports configured status when base URL is set', () => {
    expect(service.isConfigured()).toBe(true);
    expect(service.getStatus()).toEqual({
      configured: true,
      baseUrl: 'https://broker.example.com',
    });
  });
});
