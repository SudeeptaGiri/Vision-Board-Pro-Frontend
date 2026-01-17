'use client';

import { useCallback, useState, useRef } from 'react';
import { useS3Upload } from '@/hooks/use-s3-upload';
import { cn } from '@/lib/utils';
import {
  Upload,
  X,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ImageUploaderProps {
  onUploadComplete: (url: string, key: string) => void;
  visionBoardId?: string;
  className?: string;
}

export function ImageUploader({
  onUploadComplete,
  visionBoardId,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, isUploading, progress, error, reset } = useS3Upload({
    onSuccess: () => setUploadComplete(true),
  });

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const result = await upload(file, visionBoardId);
        onUploadComplete(result.url, result.key);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    },
    [upload, visionBoardId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleReset = () => {
    setPreview(null);
    setUploadComplete(false);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Upload Area - Initial State */}
      {!preview && !isUploading && !error && (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all',
            isDragging
              ? 'border-terracotta bg-terracotta/10'
              : 'border-warm-border dark:border-warm-muted hover:border-terracotta hover:bg-warm-card/50'
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload
              className={cn(
                'w-10 h-10 mb-3 transition-colors',
                isDragging ? 'text-terracotta' : 'text-warm-muted'
              )}
            />
            <p className="mb-2 text-sm text-warm-muted dark:text-warm-border">
              <span className="font-semibold text-warm-text dark:text-warm-bg">
                Click to upload
              </span>{' '}
              or drag and drop
            </p>
            <p className="text-xs text-warm-muted dark:text-warm-border">
              PNG, JPG, GIF or WebP (max 10MB)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleInputChange}
          />
        </label>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-terracotta rounded-xl bg-terracotta/10">
          {preview && (
            <div className="relative w-20 h-20 mb-4 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta" />
              </div>
            </div>
          )}
          <p className="text-sm font-medium text-terracotta mb-2">
            Uploading...
          </p>
          {progress && (
            <div className="w-48">
              <Progress value={progress.percentage} className="h-2" />
              <p className="text-xs text-center text-warm-muted mt-1">
                {progress.percentage}%
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {!isUploading && preview && uploadComplete && !error && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-sage">
          <img
            src={preview}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-sage" />
              <p className="font-medium">Upload Complete!</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleReset}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center w-full h-48 border-2 border-status-alert rounded-xl bg-status-alert/10">
          <AlertCircle className="w-10 h-10 text-status-alert mb-3" />
          <p className="text-sm font-medium text-status-alert mb-2">
            Upload Failed
          </p>
          <p className="text-xs text-status-alert/80 mb-4 text-center px-4">
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}