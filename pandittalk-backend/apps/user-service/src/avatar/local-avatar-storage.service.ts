import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import type { AvatarStorage } from './avatar-storage.interface';
import { parseUserIdFromAvatarObjectKey } from './avatar-url.util';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

@Injectable()
export class LocalAvatarStorageService implements AvatarStorage {
  private readonly uploadDir: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>(
      'AVATAR_UPLOAD_DIR',
      'uploads/avatars',
    );
    this.publicBaseUrl = this.configService
      .get<string>(
        'AVATAR_PUBLIC_BASE_URL',
        'http://localhost:3001/static/avatars',
      )
      .replace(/\/$/, '');
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<string> {
    const userId = parseUserIdFromAvatarObjectKey(key);
    if (!userId) {
      throw new Error(`Invalid local avatar object key: ${key}`);
    }

    const ext = MIME_EXT[contentType.toLowerCase()] ?? 'jpg';
    const userDir = join(process.cwd(), this.uploadDir, userId);
    await mkdir(userDir, { recursive: true });

    const filename = `${randomUUID()}.${ext}`;
    const filePath = join(userDir, filename);
    await writeFile(filePath, buffer);

    return `${this.publicBaseUrl}/${userId}/${filename}`;
  }

  async delete(key: string): Promise<void> {
    if (!key.trim()) return;

    const filePath = join(process.cwd(), this.uploadDir, ...key.split('/'));
    try {
      await unlink(filePath);
    } catch {
      // File may already be gone.
    }
  }
}
