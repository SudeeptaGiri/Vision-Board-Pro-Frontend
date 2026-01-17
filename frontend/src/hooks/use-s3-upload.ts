import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  key: string;
  url: string;
}

interface UseS3UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: string) => void;
}

interface UseS3UploadReturn {
  upload: (file: File, visionBoardId?: string) => Promise<UploadResult>;
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  reset: () => void;
}

export function useS3Upload(options?: UseS3UploadOptions): UseS3UploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File, visionBoardId?: string): Promise<UploadResult> => {
      setIsUploading(true);
      setProgress(null);
      setError(null);

      try {
        // Step 1: Get presigned URL from backend
        const { data: presignedData } = await api.post(
          '/vision-boards/upload/presigned-url',
          {
            fileType: file.type,
            fileSize: file.size,
            visionBoardId,
          }
        );

        const { uploadUrl, key, publicUrl } = presignedData;

        // Step 2: Upload directly to S3 using XMLHttpRequest for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progressData = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              };
              setProgress(progressData);
              options?.onProgress?.(progressData);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted'));
          });

          xhr.open('PUT', uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });

        // Step 3: Confirm upload with backend
        await api.post('/vision-boards/upload/confirm', {
          key,
          publicUrl,
          visionBoardId,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        });

        const result = { key, url: publicUrl };

        setIsUploading(false);
        setProgress({ loaded: file.size, total: file.size, percentage: 100 });
        options?.onSuccess?.(result);

        return result;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.error || err.message || 'Upload failed';
        setError(errorMessage);
        setIsUploading(false);
        options?.onError?.(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [options]
  );

  return {
    upload,
    isUploading,
    progress,
    error,
    reset,
  };
}