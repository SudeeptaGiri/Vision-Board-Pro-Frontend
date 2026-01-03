import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '../middleware/upload';

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
              },
            },
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
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
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!visionBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    res.json(visionBoard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vision board' });
  }
};

export const createVisionBoard = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, theme, backgroundColor } = req.body;

    const visionBoard = await prisma.visionBoard.create({
      data: {
        title,
        description,
        theme: theme || 'default',
        backgroundColor: backgroundColor || '#f8fafc',
        userId: req.user!.id,
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
    const updates = req.body;

    const existingBoard = await prisma.visionBoard.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existingBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    const visionBoard = await prisma.visionBoard.update({
      where: { id },
      data: updates,
    });

    res.json(visionBoard);
  } catch (error) {
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
      return res.status(400).json({ error: 'Cannot delete default vision board' });
    }

    // Delete images from Cloudinary
    for (const item of visionBoard.items) {
      if (item.imagePublicId) {
        await deleteFromCloudinary(item.imagePublicId);
      }
    }

    await prisma.visionBoard.delete({
      where: { id },
    });

    res.json({ message: 'Vision board deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vision board' });
  }
};

export const addVisionItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, quote, goalId, positionX, positionY, width, height } = req.body;

    const visionBoard = await prisma.visionBoard.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!visionBoard) {
      return res.status(404).json({ error: 'Vision board not found' });
    }

    let imageUrl: string | null = null;
    let imagePublicId: string | null = null;

    // Upload image if provided
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file);
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.publicId;
    }

    // Get max zIndex for ordering
    const maxZIndex = await prisma.visionItem.aggregate({
      where: { visionBoardId: id },
      _max: { zIndex: true },
    });

    const visionItem = await prisma.visionItem.create({
      data: {
        type: 'IMAGE',
        title,
        quote,
        imageUrl,
        imagePublicId,
        positionX: positionX || 0,
        positionY: positionY || 0,
        width: width || 200,
        height: height || 200,
        order: (maxZIndex._max?.zIndex || 0) + 1,
        zIndex: (maxZIndex._max?.zIndex || 0) + 1,
        visionBoardId: id,
        goalId: goalId || null,
      },
      include: {
        goal: {
          select: {
            id: true,
            title: true,
            progress: true,
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

    const visionItem = await prisma.visionItem.update({
      where: { id: itemId },
      data: updates,
    });

    res.json(visionItem);
  } catch (error) {
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

    const item = await prisma.visionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Vision item not found' });
    }

    // Delete image from Cloudinary
    if (item.imagePublicId) {
      await deleteFromCloudinary(item.imagePublicId);
    }

    await prisma.visionItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Vision item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vision item' });
  }
};

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const uploadResult = await uploadToCloudinary(req.file);

    res.json({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};
