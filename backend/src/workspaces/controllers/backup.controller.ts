import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { BackupService } from '../services/backup.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('workspaces/:workspaceId/backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private backupService: BackupService) {}

  @Get()
  async createBackup(
    @Param('workspaceId') workspaceId: string,
    @Res() res: Response,
  ) {
    const backup = await this.backupService.createBackup(workspaceId);

    // Set headers for file download
    const filename = `workspace-${workspaceId}-${new Date().toISOString().split('T')[0]}.json`;
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    res.json(backup);
  }

  @Post('restore')
  @UseInterceptors(FileInterceptor('file'))
  async restoreBackup(
    @Param('workspaceId') workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('overwrite') overwrite?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Backup file is required');
    }

    try {
      const backup = JSON.parse(file.buffer.toString('utf-8'));
      
      await this.backupService.restoreBackup(workspaceId, backup, {
        overwrite: overwrite === 'true',
      });

      return {
        success: true,
        message: 'Backup restored successfully',
      };
    } catch (error: any) {
      throw new BadRequestException(`Failed to restore backup: ${error.message}`);
    }
  }
}

