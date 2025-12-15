import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiDiffService } from './api-diff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompareVersionsDto } from './dto/compare-versions.dto';

@Controller('admin/api-diff')
@UseGuards(JwtAuthGuard)
export class ApiDiffController {
  constructor(private readonly apiDiffService: ApiDiffService) {}

  /**
   * Get available versions for an API
   */
  @Get(':apiId/versions')
  async getVersions(@Param('apiId') apiId: string) {
    const versions = await this.apiDiffService.getVersions(apiId);

    return {
      apiId,
      versions,
      total: versions.length,
    };
  }

  /**
   * Compare two API versions
   */
  @Post(':apiId/compare')
  async compareVersions(
    @Param('apiId') apiId: string,
    @Body() dto: CompareVersionsDto,
  ) {
    const diff = await this.apiDiffService.compareVersions(
      apiId,
      dto.fromVersion,
      dto.toVersion,
    );

    return {
      apiId,
      diff,
      hasBreakingChanges: diff.breakingChangesCount > 0,
      message:
        diff.breakingChangesCount > 0
          ? `Found ${diff.breakingChangesCount} breaking change(s)`
          : 'No breaking changes detected',
    };
  }

  /**
   * Quick comparison between latest and a specific version
   */
  @Get(':apiId/compare-with-latest')
  async compareWithLatest(
    @Param('apiId') apiId: string,
    @Query('version') version: string,
  ) {
    const versions = await this.apiDiffService.getVersions(apiId);
    const latestVersion = versions.find((v) => v.isLatest);

    if (!latestVersion) {
      return {
        error: 'No latest version found',
      };
    }

    const diff = await this.apiDiffService.compareVersions(
      apiId,
      version,
      latestVersion.version,
    );

    return {
      apiId,
      fromVersion: version,
      toVersion: latestVersion.version,
      diff,
      hasBreakingChanges: diff.breakingChangesCount > 0,
    };
  }
}

