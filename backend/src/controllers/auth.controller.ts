import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database';
import { config } from '../config/env';
import { AuthRequest } from '../middleware/auth';
import { sendVerificationEmail } from '../services/email/emailService';

// Generate verification token using crypto
const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user with isVerified = false
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        isVerified: false,
        verificationToken,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        createdAt: true,
      },
    });

    // Create default categories
    await prisma.category.createMany({
      data: [
        { name: 'Personal', color: '#6366f1', icon: 'user', userId: user.id },
        { name: 'Health', color: '#10b981', icon: 'heart', userId: user.id },
        { name: 'Career', color: '#f59e0b', icon: 'briefcase', userId: user.id },
        { name: 'Learning', color: '#3b82f6', icon: 'book', userId: user.id },
        { name: 'Finance', color: '#8b5cf6', icon: 'dollar-sign', userId: user.id },
      ],
    });

    // Create default vision board
    await prisma.visionBoard.create({
      data: {
        title: 'My Vision Board',
        isDefault: true,
        userId: user.id,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails, user can request resend
    }

    // Return success without token (user must verify first)
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: user.isVerified,
      },
      requiresVerification: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        requiresVerification: true,
        email: user.email,
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            goals: true,
            habits: true,
          },
        },
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, avatar },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
      },
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  // In a more complex setup, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
};

// Verify email with token
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    // Find user with this token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Update user to verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    // Generate JWT token so user can login immediately
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isVerified: true,
      },
      token: jwtToken,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Resend verification email
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account exists with this email, a verification link has been sent.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    // Generate new token
    const verificationToken = generateVerificationToken();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken },
    });

    // Send new verification email
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.json({ message: 'Verification email sent. Please check your inbox (and spam folder).' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
};