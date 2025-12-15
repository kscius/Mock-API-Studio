import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContractTestingService } from './contract-testing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UploadContractDto,
  ValidateContractDto,
  VerifyProviderDto,
  GenerateContractDto,
} from './dto';

@Controller('admin/contract-testing')
@UseGuards(JwtAuthGuard)
export class ContractTestingController {
  constructor(
    private readonly contractTestingService: ContractTestingService,
  ) {}

  /**
   * Upload a Pact contract file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadContract(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadContractDto,
  ) {
    const contractContent = file.buffer.toString('utf-8');
    const result = await this.contractTestingService.uploadContract(
      dto.apiId,
      contractContent,
    );

    return {
      ...result,
      message: 'Contract uploaded successfully',
    };
  }

  /**
   * Validate API against a contract
   */
  @Post('validate')
  async validateContract(@Body() dto: ValidateContractDto) {
    const result = await this.contractTestingService.validateContract(
      dto.apiId,
      dto.contractId,
    );

    return {
      ...result,
      message: result.valid
        ? 'Contract validation passed'
        : 'Contract validation failed',
    };
  }

  /**
   * Run Pact provider verification
   */
  @Post('verify-provider')
  async verifyProvider(@Body() dto: VerifyProviderDto) {
    const result = await this.contractTestingService.verifyProvider(
      dto.apiId,
      dto.contractId,
      dto.providerBaseUrl,
    );

    return result;
  }

  /**
   * Generate Pact contract from API
   */
  @Post('generate')
  async generateContract(@Body() dto: GenerateContractDto) {
    const contract = await this.contractTestingService.generateContract(
      dto.apiId,
      dto.consumerName,
    );

    return {
      contract,
      message: `Generated contract with ${contract.interactions.length} interactions`,
    };
  }

  /**
   * List all contracts
   */
  @Get('contracts')
  async listContracts() {
    const contracts = await this.contractTestingService.listContracts();

    return {
      contracts,
      total: contracts.length,
    };
  }

  /**
   * Get contract details
   */
  @Get('contracts/:contractId')
  async getContract(@Param('contractId') contractId: string) {
    // Implementation would read the contract file
    return {
      contractId,
      message: 'Contract details endpoint',
    };
  }
}

