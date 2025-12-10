// backend/src/api-definitions/api-definitions.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiDefinitionsService } from './api-definitions.service';
import { CreateApiDefinitionDto } from './dto/create-api-definition.dto';
import { UpdateApiDefinitionDto } from './dto/update-api-definition.dto';
import { CreateEndpointDto } from './dto/create-endpoint.dto';
import { UpdateEndpointDto } from './dto/update-endpoint.dto';
import { OpenApiParserService } from '../openapi/openapi-parser.service';

@Controller('api-definitions')
export class ApiDefinitionsController {
  constructor(
    private readonly service: ApiDefinitionsService,
    private readonly openApiParser: OpenApiParserService,
  ) {}

  // ========== API DEFINITIONS ==========

  @Get()
  findAll(@Query('workspaceId') workspaceId?: string) {
    return this.service.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOneById(id);
  }

  @Post()
  create(@Body() dto: CreateApiDefinitionDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApiDefinitionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // ========== ENDPOINTS ==========

  @Post(':apiId/endpoints')
  createEndpoint(@Param('apiId') apiId: string, @Body() dto: CreateEndpointDto) {
    return this.service.createEndpoint(apiId, dto);
  }

  @Patch('endpoints/:endpointId')
  updateEndpoint(@Param('endpointId') endpointId: string, @Body() dto: UpdateEndpointDto) {
    return this.service.updateEndpoint(endpointId, dto);
  }

  @Delete('endpoints/:endpointId')
  removeEndpoint(@Param('endpointId') endpointId: string) {
    return this.service.removeEndpoint(endpointId);
  }

  // ========== IMPORT / EXPORT ==========

  @Get(':apiId/export')
  exportApi(@Param('apiId') apiId: string) {
    return this.service.exportApi(apiId);
  }

  @Post('import')
  importApi(
    @Body() data: any,
    @Query('workspaceId') workspaceId: string,
    @Query('overwrite') overwrite?: string,
  ) {
    const shouldOverwrite = overwrite === 'true';
    return this.service.importApi(data, workspaceId, shouldOverwrite);
  }

  @Post('import/openapi')
  async importOpenApi(
    @Body() openApiSpec: any,
    @Query('workspaceId') workspaceId: string,
  ) {
    const parsed = await this.openApiParser.parseOpenApiSpec(openApiSpec);
    return this.service.importApi(parsed, workspaceId, false);
  }

  @Post('import/openapi/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOpenApi(
    @UploadedFile() file: Express.Multer.File,
    @Query('workspaceId') workspaceId: string,
    @Query('dryRun') dryRun?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    try {
      // Parse file content
      const content = file.buffer.toString('utf-8');
      let spec: any;

      if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
        spec = JSON.parse(content);
      } else if (
        file.mimetype === 'application/x-yaml' ||
        file.mimetype === 'text/yaml' ||
        file.originalname.endsWith('.yaml') ||
        file.originalname.endsWith('.yml')
      ) {
        // Para YAML, necesitaremos un parser
        // Por ahora, asumimos que el usuario envía JSON
        throw new BadRequestException('YAML support coming soon. Please convert to JSON.');
      } else {
        throw new BadRequestException('Unsupported file type. Use .json or .yaml');
      }

      // Parse OpenAPI spec
      const parsed = await this.openApiParser.parseOpenApiSpec(spec);

      // If dryRun, return what would be created
      if (dryRun === 'true') {
        return {
          dryRun: true,
          summary: {
            apiName: parsed.api.name,
            apiSlug: parsed.api.slug,
            endpointsCount: parsed.endpoints.length,
          },
          preview: parsed,
        };
      }

      // Import the API
      const result = await this.service.importApi(parsed, workspaceId, false);

      return {
        success: true,
        message: 'OpenAPI imported successfully',
        api: result,
        summary: {
          apiName: parsed.api.name,
          apiSlug: parsed.api.slug,
          endpointsCount: parsed.endpoints.length,
        },
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to parse OpenAPI: ${error.message}`);
    }
  }
}

