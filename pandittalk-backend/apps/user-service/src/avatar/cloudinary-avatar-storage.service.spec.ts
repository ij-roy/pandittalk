import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { CloudinaryAvatarStorageService } from './cloudinary-avatar-storage.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryAvatarStorageService', () => {
  const uploadStream = cloudinary.uploader.upload_stream as jest.Mock;
  const destroy = cloudinary.uploader.destroy as jest.Mock;
  const configure = cloudinary.config as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createService(): CloudinaryAvatarStorageService {
    return new CloudinaryAvatarStorageService(
      new ConfigService({
        CLOUDINARY_CLOUD_NAME: 'demo-cloud',
        CLOUDINARY_API_KEY: 'api-key',
        CLOUDINARY_API_SECRET: 'api-secret',
        CLOUDINARY_FOLDER: 'pandittalk-assets',
      }),
    );
  }

  it('uploads bytes under the normalized Cloudinary public ID and returns a secure URL', async () => {
    const end = jest.fn();
    uploadStream.mockImplementation((_options, callback) => {
      callback(null, {
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
      });
      return { end };
    });

    const service = createService();
    const result = await service.put(
      '/avatars/users/user-1.jpg',
      Buffer.from('image-bytes'),
      'image/jpeg',
    );

    expect(configure).toHaveBeenCalledWith({
      cloud_name: 'demo-cloud',
      api_key: 'api-key',
      api_secret: 'api-secret',
    });
    expect(uploadStream).toHaveBeenCalledWith(
      {
        public_id: 'pandittalk-assets/avatars/users/user-1',
        resource_type: 'image',
        overwrite: true,
        invalidate: true,
      },
      expect.any(Function),
    );
    expect(end).toHaveBeenCalledWith(Buffer.from('image-bytes'));
    expect(result).toBe(
      'https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg',
    );
  });

  it('deletes the same normalized public ID', async () => {
    destroy.mockResolvedValue({ result: 'ok' });

    await createService().delete('avatars/users/user-1.jpg');

    expect(destroy).toHaveBeenCalledWith(
      'pandittalk-assets/avatars/users/user-1',
      { resource_type: 'image', invalidate: true },
    );
  });

  it('surfaces provider upload failures', async () => {
    uploadStream.mockImplementation((_options, callback) => {
      callback(new Error('Cloudinary unavailable'), undefined);
      return { end: jest.fn() };
    });

    await expect(
      createService().put('avatars/users/user-1.jpg', Buffer.from('x'), 'image/jpeg'),
    ).rejects.toThrow('Cloudinary unavailable');
  });
});
