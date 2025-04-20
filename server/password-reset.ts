/**
 * Password Reset Module
 * 
 * This module provides functionality for handling password reset requests.
 * It includes token generation, validation, and password reset logic.
 */

import { Request, Response } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { log } from './vite';
import { storage } from './storage';
import { logUpdate } from './update-logger';

// Security settings
const TOKEN_EXPIRY_HOURS = 24;
const TOKEN_LENGTH = 40;

// Store for reset tokens (in-memory for now, should be moved to database in production)
const resetTokens = new Map<string, { userId: number, expiresAt: Date }>();

// Validation schema for password reset request
const resetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

// Validation schema for password reset form
const resetPasswordSchema = z.object({
  token: z.string().min(TOKEN_LENGTH, 'Invalid token'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Validation schema for token validation
const validateTokenSchema = z.object({
  token: z.string().min(TOKEN_LENGTH, 'Invalid token')
});

/**
 * Handle password reset request (first step - email)
 * Creates a reset token and sends a reset email
 */
export function handlePasswordReset(req: Request, res: Response) {
  try {
    // Validate request data
    const { email } = resetRequestSchema.parse(req.body);

    // Find user by email
    storage.getUserByEmail(email)
      .then(user => {
        if (!user) {
          // For security reasons, don't reveal that the email doesn't exist
          return res.status(200).json({
            success: true,
            message: "If your email is registered, you will receive password reset instructions."
          });
        }

        // Generate a reset token
        const token = generateResetToken(user.id);

        // In a real application, send an email with the reset link
        // For demo purposes, we'll just log it
        log(`Password reset requested for ${email}. Reset token: ${token}`, 'auth');
        
        // Log update for monitoring
        logUpdate(`Password reset requested for user ID ${user.id}`, 'auth');

        // Return success response
        res.status(200).json({
          success: true,
          message: "If your email is registered, you will receive password reset instructions."
        });
      })
      .catch(error => {
        log(`Error looking up user: ${error}`, 'auth');
        res.status(500).json({
          success: false,
          message: "Failed to process your request. Please try again later."
        });
      });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    log(`Error processing password reset request: ${error}`, 'auth');
    res.status(500).json({
      success: false,
      message: "Failed to process your request. Please try again later."
    });
  }
}

/**
 * Handle password reset (second step - new password)
 * Validates token and resets password
 */
export function resetPassword(req: Request, res: Response) {
  try {
    // Validate request data
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Check if token exists and is valid
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token. Please request a new password reset."
      });
    }

    // Check if token is expired
    if (tokenData.expiresAt < new Date()) {
      // Remove expired token
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        message: "Token has expired. Please request a new password reset."
      });
    }

    // Get user ID from token
    const userId = tokenData.userId;

    // Update user's password
    storage.updatePassword(userId, password)
      .then(success => {
        if (!success) {
          return res.status(500).json({
            success: false,
            message: "Failed to update password. Please try again."
          });
        }

        // Remove used token
        resetTokens.delete(token);

        // Log success
        log(`Password reset successful for user ID ${userId}`, 'auth');
        logUpdate(`User ID ${userId} reset their password`, 'auth');

        // Return success response
        res.status(200).json({
          success: true,
          message: "Your password has been updated. You can now log in with your new password."
        });
      })
      .catch(error => {
        log(`Error updating password: ${error}`, 'auth');
        res.status(500).json({
          success: false,
          message: "Failed to update password. Please try again."
        });
      });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }

    log(`Error processing password reset: ${error}`, 'auth');
    res.status(500).json({
      success: false,
      message: "Failed to process your request. Please try again later."
    });
  }
}

/**
 * Validates a reset token
 * Used by the client to check if token is valid before showing reset form
 */
export function validateResetToken(req: Request, res: Response) {
  try {
    // Validate request data
    const { token } = validateTokenSchema.parse(req.body);

    // Check if token exists and is valid
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token. Please request a new password reset."
      });
    }

    // Check if token is expired
    if (tokenData.expiresAt < new Date()) {
      // Remove expired token
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        message: "Token has expired. Please request a new password reset."
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Token is valid."
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid token format."
      });
    }

    log(`Error validating reset token: ${error}`, 'auth');
    res.status(500).json({
      success: false,
      message: "Failed to validate token. Please try again."
    });
  }
}

/**
 * Generates a secure random token for password reset
 * @param userId The user ID associated with the token
 * @returns The generated token
 */
function generateResetToken(userId: number): string {
  const token = randomBytes(TOKEN_LENGTH).toString('hex');
  
  // Set expiry date (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);
  
  // Store token
  resetTokens.set(token, { userId, expiresAt });
  
  return token;
}

/**
 * Cleans up expired tokens (should be called periodically)
 */
export function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
}

// Set up periodic token cleanup
setInterval(cleanupExpiredTokens, 1000 * 60 * 60); // Clean up every hour

/**
 * Request a password reset
 * Export the function for routes.ts
 */
export const requestPasswordReset = handlePasswordReset;