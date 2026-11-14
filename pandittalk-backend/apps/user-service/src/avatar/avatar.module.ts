import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AVATAR_STORAGE } from './avatar-storage.interface';
import { LocalAvatarStorageService } from './local-avatar-storage.service';
import { S3AvatarStorageService } from './s3-avatar-storage.service';

@Module({
  providers: [
    LocalAvatarStorageService,
    {
      provide: AVATAR_STORAGE,
      inject: [ConfigService, LocalAvatarStorageService],
      useFactory: (
        configService: ConfigService,
        local: LocalAvatarStorageService,
      ) => {
        const mode = configService.get<string>('AVATAR_STORAGE', 'local');
        if (mode === 'local') return local;
        if (mode === 's3') return new S3AvatarStorageService(configService);
        throw new Error(`Unknown AVATAR_STORAGE: ${mode}`);
      },
    },
  ],
  exports: [AVATAR_STORAGE],
})
export class AvatarModule {}
