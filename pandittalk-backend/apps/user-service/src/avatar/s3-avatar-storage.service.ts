import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AvatarStorage } from './avatar-storage.interface';

@Injectable()
export class S3AvatarStorageService implements AvatarStorage {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cdnBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    const region = this.configService.get<string>('S3_MEDIA_REGION');
    const bucket = this.configService.get<string>('S3_MEDIA_BUCKET');
    const cdnBaseUrl = this.configService
      .get<string>('MEDIA_CDN_URL')
      ?.replace(/\/$/, '');

    if (!region || !bucket || !cdnBaseUrl) {
      throw new Error(
        'S3_MEDIA_REGION, S3_MEDIA_BUCKET, and MEDIA_CDN_URL must be configured when AVATAR_STORAGE=s3',
      );
    }

    this.bucket = bucket;
    this.cdnBaseUrl = cdnBaseUrl;
    this.client = new S3Client({
      region,
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
  }

  async put(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return `${this.cdnBaseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    if (!key.trim()) return;

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch {
      // Object may already be gone.
    }
  }
}
