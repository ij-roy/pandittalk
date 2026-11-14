import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AvatarModule } from '../avatar/avatar.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { BloggerSyncService } from './blogger-sync.service';
import { PanditGuard } from './guards/pandit.guard';
import { PanditArticlesController } from './pandit-articles.controller';
import { PanditArticlesService } from './pandit-articles.service';

@Module({
  imports: [PrismaModule, ConfigModule, AvatarModule],
  controllers: [ArticlesController, PanditArticlesController],
  providers: [
    ArticlesService,
    BloggerSyncService,
    PanditArticlesService,
    PanditGuard,
  ],
})
export class ArticlesModule {}
