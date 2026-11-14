import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReportsModule } from '../reports/reports.module';
import { DetailedCompatibilityGuard } from './guards/detailed-compatibility.guard';
import { DetailedKundliGuard } from './guards/detailed-kundli.guard';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';

@Module({
  imports: [ConfigModule, ReportsModule],
  controllers: [ToolsController],
  providers: [ToolsService, DetailedKundliGuard, DetailedCompatibilityGuard],
})
export class ToolsModule {}
