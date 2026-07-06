import { Controller, Get, Param, Query } from '@nestjs/common';
import { OpenApiGeneratorService } from '../openapi/openapi-generator.service';
import { ApiDefinitionsService } from '../api-definitions/api-definitions.service';

@Controller('admin/sdk')
export class SdkController {
  constructor(
    private readonly apiService: ApiDefinitionsService,
    private readonly openApiGenerator: OpenApiGeneratorService,
  ) {}

  @Get(':apiId/:language')
  async getSdkInfo(
    @Param('apiId') apiId: string,
    @Param('language') language: string,
  ) {
    const api = await this.apiService.findOneById(apiId);
    if (!api) {
      return { error: 'API not found' };
    }

    const spec = this.openApiGenerator.generateOpenApiSpec(
      api as any,
      process.env.MOCK_BASE_URL || 'http://localhost:3000',
    );

    const supported = ['typescript', 'python', 'go', 'java', 'csharp'];
    if (!supported.includes(language.toLowerCase())) {
      return {
        error: `Unsupported language. Supported: ${supported.join(', ')}`,
      };
    }

    return {
      apiId,
      language,
      openApiSpecUrl: `/api-definitions/${apiId}/openapi.json`,
      generatorCommand: `npx @openapitools/openapi-generator-cli generate -i openapi.json -g ${this.mapGenerator(language)} -o ./sdk-${language}`,
      spec,
    };
  }

  private mapGenerator(language: string): string {
    const map: Record<string, string> = {
      typescript: 'typescript-axios',
      python: 'python',
      go: 'go',
      java: 'java',
      csharp: 'csharp',
    };
    return map[language.toLowerCase()] ?? 'typescript-axios';
  }
}
