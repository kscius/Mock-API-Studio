import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SmartMockService } from './smart-mock.service';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly smartMock: SmartMockService) {}

  @Post('generate-mocks')
  async generateMocks(
    @Body() body: { apiId: string; description: string },
  ) {
    return this.smartMock.generateFromDescription(body.apiId, body.description);
  }
}
