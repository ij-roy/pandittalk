import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { AvatarStorage } from './avatar-storage.interface';

@Injectable()
export class CloudinaryAvatarStorageService implements AvatarStorage {
  private readonly folder: string;

  constructor(configService: ConfigService) {
    const cloudName = configService
      .get<string>('CLOUDINARY_CLOUD_NAME')
      ?.trim();
    const apiKey = configService.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = configService
      .get<string>('CLOUDINARY_API_SECRET')
      ?.trim();
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured when AVATAR_STORAGE=cloudinary',
      );
    }

    this.folder = this.normalizeFolder(
      configService.get<string>('CLOUDINARY_FOLDER', 'pandittalk'),
    );
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async put(
    key: string,
    buffer: Buffer,
    _contentType: string,
  ): Promise<string> {
    const publicId = this.publicIdForKey(key);

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error) {
            reject(this.toError(error));
            return;
          }
          if (!result?.secure_url) {
            reject(new Error('Cloudinary upload did not return a secure URL'));
            return;
          }
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }

  async delete(key: string): Promise<void> {
    if (!key.trim()) {
      return;
    }

    await cloudinary.uploader.destroy(this.publicIdForKey(key), {
      resource_type: 'image',
      invalidate: true,
    });
  }

  private publicIdForKey(key: string): string {
    const normalizedKey = key.trim().replace(/^\/+|\/+$/g, '');
    const withoutExtension = normalizedKey.replace(/\.[^/.]+$/, '');
    if (!withoutExtension) {
      throw new Error(`Invalid Cloudinary object key: ${key}`);
    }
    return `${this.folder}/${withoutExtension}`;
  }

  private normalizeFolder(folder: string): string {
    return folder.trim().replace(/^\/+|\/+$/g, '') || 'pandittalk';
  }

  private toError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    return new Error('Cloudinary upload failed');
  }
}
