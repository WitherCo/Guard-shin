import crypto from 'crypto';
import { Request, Response } from 'express';
import { sendPasswordResetEmail } from './email';
import { storage } from './storage';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';

// Schema for password reset request validation
const resetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Schema for password reset validation
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Store reset tokens in memory for development
// In production, these would be stored in the database
const resetTokens = new Map<string, { userId: number, email: string, expires: Date }>();

/**
 * Generate a password reset token
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Request a password reset
 */
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    // Validate the request body
    const result = resetRequestSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid request', 
        errors: result.error.errors 
      });
    }
    
    const { email } = result.data;
    
    // Find user by email (we don't have email field explicitly, so we need to search users)
    // For now (development), allow searching by username as well
    const user = await storage.getUserByUsername(email);
    
    // Don't reveal if user exists or not for security reasons
    if (!user) {
      return res.status(200).json({ 
        message: 'If your email is registered, you will receive a password reset link shortly.' 
      });
    }
    
    // Generate a token
    const token = generateResetToken();
    
    // Store token (in memory for dev, in DB for production)
    const expiresIn = 60 * 60 * 1000; // 1 hour
    resetTokens.set(token, {
      userId: user.id,
      email: email,
      expires: new Date(Date.now() + expiresIn),
    });
    
    // Send reset email
    await sendPasswordResetEmail(email, token, user.username);
    
    // Return success regardless of whether user exists
    return res.status(200).json({ 
      message: 'If your email is registered, you will receive a password reset link shortly.' 
    });
  } catch (error) {
    console.error('Error in password reset request:', error);
    return res.status(500).json({ message: 'An error occurred while processing your request' });
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    // Validate the request body
    const result = resetPasswordSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid request', 
        errors: result.error.errors 
      });
    }
    
    const { token, password } = result.data;
    
    // Verify token
    const resetData = resetTokens.get(token);
    
    if (!resetData) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Check if token is expired
    if (resetData.expires < new Date()) {
      resetTokens.delete(token);
      return res.status(400).json({ message: 'Reset token has expired' });
    }
    
    // Get user
    const user = await storage.getUser(resetData.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update password in database
    await db.execute(sql`
      UPDATE users 
      SET password = ${hashedPassword}
      WHERE id = ${user.id}
    `);
    
    // Remove the used token
    resetTokens.delete(token);
    
    // Return success
    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error in password reset:', error);
    return res.status(500).json({ message: 'An error occurred while resetting your password' });
  }
}