import { useState } from 'react';
import { client } from '@/src/api/client';
import { toast } from 'react-hot-toast';

interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

interface UseFileUploadReturn {
  uploadFile: (file: File, roomId: string) => Promise<string | null>;
  isUploading: boolean;
  uploadProgress: number;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (
    file: File,
    roomId: string
  ): Promise<string | null> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get Presigned URL
      const { data: presignedData } = await client.post<PresignedUrlResponse>(
        '/files/presigned-url',
        {
          fileName: file.name,
          contentType: file.type,
          roomId: roomId,
        }
      );

      // 2. Upload to S3
      // Note: We use fetch directly here to avoid interceptors or headers that might conflict with S3
      // S3 presigned URLs require specific headers (or lack thereof)
      const uploadResponse = await fetch(presignedData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to storage');
      }

      setUploadProgress(100);
      return presignedData.publicUrl;
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, uploadProgress };
};
