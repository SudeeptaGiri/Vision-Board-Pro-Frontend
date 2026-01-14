import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL!,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  ai: {
    openaiKey: process.env.OPENAI_API_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
    provider: process.env.AI_PROVIDER || 'openai', // 'openai' or 'gemini'
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  
  // SendGrid Email Configuration
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.FROM_EMAIL || 'sudeeptagiri22@gmail.com',
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};