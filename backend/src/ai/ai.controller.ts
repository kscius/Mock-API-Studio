import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SmartMockService } from './smart-mock.service';
import { AutoDocumentationService } from './auto-documentation.service';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly smartMock: SmartMockService,
    private readonly autoDocumentation: AutoDocumentationService,
  ) {}

  @Post('generate-mocks')
  async generateMocks(
    @Body() body: { apiId: string; description: string },
  ) {
    return this.smartMock.generateFromDescription(body.apiId, body.description);
  }

  @Post('generate-docs')
  async generateDocs(@Body() body: { apiId: string }) {
    return this.autoDocumentation.generateMarkdown(body.apiId);
  }
}
