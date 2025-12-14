import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { DataExportService } from './services/data-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private dataExportService: DataExportService) {}

  @Get(':userId/export')
  async exportUserData(
    @Param('userId') userId: string,
    @Query('format') format: string,
    @CurrentUser() currentUser: any,
    @Res() res: Response,
  ) {
    // Users can only export their own data (or admins can export any user's data)
    if (currentUser.id !== userId && currentUser.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const filename = `user-${userId}-${new Date().toISOString().split('T')[0]}`;

    if (format === 'csv') {
      const csv = await this.dataExportService.exportUserDataAsCsv(userId);
      
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      });
      
      res.send(csv);
    } else {
      // Default to JSON
      const data = await this.dataExportService.exportUserData(userId);
      
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      });
      
      res.json(data);
    }
  }
}

