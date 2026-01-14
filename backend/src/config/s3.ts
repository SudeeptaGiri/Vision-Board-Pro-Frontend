import { S3Client } from '@aws-sdk/client-s3';

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS credentials not configured - S3 uploads will not work');
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const bucketName = process.env.AWS_BUCKET_NAME ;