import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucketName } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

// Allowed file types
const ALLOWED_FILE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface GenerateUploadURLParams {
  fileType: string;
  fileSize: number;
  userId: string;
}

interface UploadURLResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

/**
 * Generate a presigned URL for uploading an image directly to S3
 */
export async function generateUploadURL({
  fileType,
  fileSize,
  userId,
}: GenerateUploadURLParams): Promise<UploadURLResponse> {
  // Validate file type
  const extension = ALLOWED_FILE_TYPES[fileType];
  if (!extension) {
    throw new Error(
      `Invalid file type: ${fileType}. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`
    );
  }

  // Validate file size
  if (fileSize > MAX_FILE_SIZE) {
    throw new Error(
      `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // Generate unique key with user folder structure
  const key = `vision-boards/${userId}/${uuidv4()}.${extension}`;

  // Create the put command
  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: fileType,
    ContentLength: fileSize,
    Metadata: {
      userId,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Generate presigned URL (valid for 5 minutes)
  const uploadUrl = await getSignedUrl(s3Client, putCommand, {
    expiresIn: 300,
  });

  // Construct the public URL
  const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

/**
 * Delete an image from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(deleteCommand);
    console.log(`Deleted from S3: ${key}`);
  } catch (error) {
    console.error(`Failed to delete from S3: ${key}`, error);
    throw error;
  }
}

/**
 * Delete multiple images from S3
 */
export async function deleteMultipleFromS3(keys: string[]): Promise<void> {
  const deletePromises = keys.map((key) => deleteFromS3(key));
  await Promise.allSettled(deletePromises);
}

/**
 * Extract S3 key from a full S3 URL
 */
export function extractKeyFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch {
    return null;
  }
}

/**
 * Generate a presigned URL for viewing a private image
 */
export async function generateViewURL(key: string): Promise<string> {
  const getCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const viewUrl = await getSignedUrl(s3Client, getCommand, {
    expiresIn: 3600, // 1 hour
  });

  return viewUrl;
}