import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import {
  generateUploadURL,
  deleteFromS3,
  extractKeyFromUrl,
  deleteMultipleFromS3,
} from '../utils/s3-helpers';

// ==================== VISION BOARDS ====================

export const getVisionBoards = async (req: AuthRequest, res: Response) => {
  try {
    const visionBoards = await prisma.visionBoard.findMany({
      where: {
        userId: req.user!.id,
      },
      include: {
        items: {
          include: {
            goal: {
              select: {
                id: true,
                title: true,
                progress: true,
                type: true,
              },
            },
          },
          orderBy: { zIndex: 'asc' },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.json(visionBoards);
  } catch (error) {
    console.error('Get vision boards error:', error);
    res.status(500).json({ error: 'Failed to fetch vision boards' });
  }
};

export const getVisionBoard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const visionBoard = await prisma.visionBoard.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        items: {
          include: {
            goal: {
              select: {
                id: true,
                title: true,
                progress: true,
                status: true,
                type: true,
              },
            },
          },
          orderBy: { zIndex: 'asc' },
        },
      },
    });

    if (!visionBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    res.json(visionBoard);
  } catch (error) {
    console.error('Get vision board error:', error);
    res.status(500).json({ error: 'Failed to fetch vision board' });
  }
};

export const createVisionBoard = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, theme, backgroundColor, background } = req.body;

    // Check if user has any boards, make first one default
    const existingBoards = await prisma.visionBoard.count({
      where: { userId: req.user!.id },
    });

    const visionBoard = await prisma.visionBoard.create({
      data: {
        title: title || 'My Vision Board',
        description,
        theme: theme || 'default',
        backgroundColor: backgroundColor || '#f8fafc',
        background:
          background ||
          'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        isDefault: existingBoards === 0,
        userId: req.user!.id,
      },
      include: {
        items: true,
      },
    });

    res.status(201).json(visionBoard);
  } catch (error) {
    console.error('Create vision board error:', error);
    res.status(500).json({ error: 'Failed to create vision board' });
  }
};

export const updateVisionBoard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, theme, backgroundColor, background } = req.body;

    const existingBoard = await prisma.visionBoard.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existingBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    const visionBoard = await prisma.visionBoard.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(theme && { theme }),
        ...(backgroundColor && { backgroundColor }),
        ...(background && { background }),
      },
      include: {
        items: {
          include: {
            goal: {
              select: {
                id: true,
                title: true,
                progress: true,
                type: true,
              },
            },
          },
        },
      },
    });

    res.json(visionBoard);
  } catch (error) {
    console.error('Update vision board error:', error);
    res.status(500).json({ error: 'Failed to update vision board' });
  }
};

export const deleteVisionBoard = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const visionBoard = await prisma.visionBoard.findFirst({
      where: { id, userId: req.user!.id },
      include: { items: true },
    });

    if (!visionBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    if (visionBoard.isDefault) {
      return res
        .status(400)
        .json({ error: 'Cannot delete default vision board' });
    }

    // Collect all S3 keys to delete
    const keysToDelete = visionBoard.items
      .filter((item) => item.imageKey)
      .map((item) => item.imageKey as string);

    // Delete images from S3
    if (keysToDelete.length > 0) {
      await deleteMultipleFromS3(keysToDelete);
    }

    // Delete uploaded images records
    await prisma.uploadedImage.deleteMany({
      where: { visionBoardId: id },
    });

    // Delete the vision board (cascade deletes items)
    await prisma.visionBoard.delete({
      where: { id },
    });

    res.json({ message: 'Vision board deleted successfully' });
  } catch (error) {
    console.error('Delete vision board error:', error);
    res.status(500).json({ error: 'Failed to delete vision board' });
  }
};

// ==================== VISION ITEMS ====================

export const addVisionItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      type,
      title,
      quote,
      imageUrl,
      imageKey,
      goalId,
      positionX,
      positionY,
      width,
      height,
    } = req.body;

    const visionBoard = await prisma.visionBoard.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!visionBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    // Validate goal if provided
    if (goalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: goalId, userId: req.user!.id },
      });
      if (!goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }
    }

    // Get max zIndex for ordering
    const maxZIndex = await prisma.visionItem.aggregate({
      where: { visionBoardId: id },
      _max: { zIndex: true },
    });

    const newZIndex = (maxZIndex._max?.zIndex || 0) + 1;

    const visionItem = await prisma.visionItem.create({
      data: {
        type: type || 'IMAGE',
        title,
        quote,
        imageUrl,
        imageKey,
        positionX: positionX ?? Math.random() * 400,
        positionY: positionY ?? Math.random() * 300,
        width: width ?? 200,
        height: height ?? 200,
        order: newZIndex,
        zIndex: newZIndex,
        visionBoardId: id,
        goalId: goalId || null,
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            progress: true,
            type: true,
          },
        },
      },
    });

    res.status(201).json(visionItem);
  } catch (error) {
    console.error('Add vision item error:', error);
    res.status(500).json({ error: 'Failed to add vision item' });
  }
};

export const updateVisionItem = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId, itemId } = req.params;
    const updates = req.body;

    const visionBoard = await prisma.visionBoard.findFirst({
      where: { id: boardId, userId: req.user!.id },
    });

    if (!visionBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    const existingItem = await prisma.visionItem.findFirst({
      where: { id: itemId, visionBoardId: boardId },
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Vision item not found' });
    }

    // If updating image, delete old one from S3
    if (updates.imageUrl && existingItem.imageKey && updates.imageKey !== existingItem.imageKey) {
      try {
        await deleteFromS3(existingItem.imageKey);
      } catch (error) {
        console.error('Failed to delete old image:', error);
      }
    }

    const visionItem = await prisma.visionItem.update({
      where: { id: itemId },
      data: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.quote !== undefined && { quote: updates.quote }),
        ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
        ...(updates.imageKey !== undefined && { imageKey: updates.imageKey }),
        ...(updates.positionX !== undefined && { positionX: updates.positionX }),
        ...(updates.positionY !== undefined && { positionY: updates.positionY }),
        ...(updates.width !== undefined && { width: updates.width }),
        ...(updates.height !== undefined && { height: updates.height }),
        ...(updates.rotation !== undefined && { rotation: updates.rotation }),
        ...(updates.zIndex !== undefined && { zIndex: updates.zIndex }),
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            progress: true,
            type: true,
          },
        },
      },
    });

    res.json(visionItem);
  } catch (error) {
    console.error('Update vision item error:', error);
    res.status(500).json({ error: 'Failed to update vision item' });
  }
};

export const deleteVisionItem = async (req: AuthRequest, res: Response) => {
  try {
    const { boardId, itemId } = req.params;

    const visionBoard = await prisma.visionBoard.findFirst({
      where: { id: boardId, userId: req.user!.id },
    });

    if (!visionBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    const item = await prisma.visionItem.findFirst({
      where: { id: itemId, visionBoardId: boardId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Vision item not found' });
    }

    // Delete image from S3 if exists
    if (item.imageKey) {
      try {
        await deleteFromS3(item.imageKey);
      } catch (error) {
        console.error('Failed to delete image from S3:', error);
      }
    }

    await prisma.visionItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Vision item deleted successfully' });
  } catch (error) {
    console.error('Delete vision item error:', error);
    res.status(500).json({ error: 'Failed to delete vision item' });
  }
};

// ==================== S3 UPLOAD ====================

/**
 * Get presigned URL for direct S3 upload
 */
export const getPresignedUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { fileType, fileSize, visionBoardId } = req.body;

    if (!fileType || !fileSize) {
      return res.status(400).json({
        error: 'fileType and fileSize are required',
      });
    }

    // Verify vision board belongs to user if provided
    if (visionBoardId) {
      const board = await prisma.visionBoard.findFirst({
        where: { id: visionBoardId, userId: req.user!.id },
      });
      if (!board) {
        return res.status(404).json({ error: 'Vision board not found' });
      }
    }

    const { uploadUrl, key, publicUrl } = await generateUploadURL({
      fileType,
      fileSize,
      userId: req.user!.id,
    });

    res.json({
      uploadUrl,
      key,
      publicUrl,
    });
  } catch (error: any) {
    console.error('Error generating presigned URL:', error);
    res.status(400).json({
      error: error.message || 'Failed to generate upload URL',
    });
  }
};

/**
 * Confirm upload completed and save to database
 */
export const confirmUpload = async (req: AuthRequest, res: Response) => {
  try {
    const { key, publicUrl, visionBoardId, fileName, fileSize, mimeType } = req.body;

    if (!key || !publicUrl) {
      return res.status(400).json({
        error: 'key and publicUrl are required',
      });
    }

    // Verify vision board belongs to user if provided
    if (visionBoardId) {
      const board = await prisma.visionBoard.findFirst({
        where: { id: visionBoardId, userId: req.user!.id },
      });
      if (!board) {
        return res.status(404).json({ error: 'Vision board not found' });
      }
    }

    // Save image record to database
    const image = await prisma.uploadedImage.create({
      data: {
        key,
        url: publicUrl,
        fileName,
        fileSize,
        mimeType,
        userId: req.user!.id,
        visionBoardId: visionBoardId || null,
      },
    });

    res.json({
      success: true,
      image,
    });
  } catch (error: any) {
    console.error('Error confirming upload:', error);
    res.status(500).json({
      error: 'Failed to confirm upload',
    });
  }
};

/**
 * Get user's uploaded images
 */
export const getMyImages = async (req: AuthRequest, res: Response) => {
  try {
    const { visionBoardId } = req.query;

    const where: any = { userId: req.user!.id };
    if (visionBoardId) {
      where.visionBoardId = visionBoardId;
    }

    const images = await prisma.uploadedImage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(images);
  } catch (error: any) {
    console.error('Error fetching images:', error);
    res.status(500).json({
      error: 'Failed to fetch images',
    });
  }
};

/**
 * Delete an uploaded image
 */
export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    const { imageId } = req.params;

    const image = await prisma.uploadedImage.findFirst({
      where: {
        id: imageId,
        userId: req.user!.id,
      },
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete from S3
    try {
      await deleteFromS3(image.key);
    } catch (error) {
      console.error('Failed to delete from S3:', error);
    }

    // Delete from database
    await prisma.uploadedImage.delete({
      where: { id: imageId },
    });

    // Also update any vision board items using this image
    await prisma.visionItem.updateMany({
      where: { imageUrl: image.url },
      data: { imageUrl: null, imageKey: null },
    });

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      error: 'Failed to delete image',
    });
  }
};

/**
 * Direct file upload (legacy/fallback endpoint)
 * Accepts multipart/form-data and uploads to S3
 */
export const directUpload = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    const { visionBoardId } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Import S3 client
    const { s3Client } = await import('../config/s3');
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const { v4: uuidv4 } = await import('uuid');

    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!bucketName) {
      return res.status(500).json({ error: 'S3 bucket not configured' });
    }

    // Generate unique key
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const key = `vision-boards/${req.user!.id}/${uuidv4()}.${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    // Save to database
    const image = await prisma.uploadedImage.create({
      data: {
        key,
        url: publicUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        userId: req.user!.id,
        visionBoardId: visionBoardId || null,
      },
    });

    res.json({
      success: true,
      key,
      url: publicUrl,
      image,
    });
  } catch (error: any) {
    console.error('Direct upload error:', error);
    res.status(500).json({
      error: error.message || 'Failed to upload file',
    });
  }
};