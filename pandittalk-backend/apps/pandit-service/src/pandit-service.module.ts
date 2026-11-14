import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@pandittalk/common';
import { PanditServiceController } from './pandit-service.controller';
import { PanditServiceService } from './pandit-service.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        'apps/pandit-service/.env.local',
        'apps/pandit-service/.env',
        '.env.local',
        '.env',
      ],
    }),
    CommonModule,
  ],
  controllers: [PanditServiceController],
  providers: [PanditServiceService],
})
export class PanditServiceModule {}
