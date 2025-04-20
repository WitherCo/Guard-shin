/**
 * Contact Module
 * 
 * This module provides functionality for handling contact form submissions.
 * It includes validation, processing, and response handling for contact requests.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { log } from './vite';
import { logUpdate } from './update-logger';
import { storage } from './storage';

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(100, "Subject is too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
  recaptcha: z.string().optional()
});

// Validation schema for contact form when authenticated
const authenticatedContactSchema = contactSchema.partial({
  name: true,
  email: true
});

/**
 * Handle contact form submissions from authenticated users
 */
export function handleAuthenticatedContact(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to use this form"
      });
    }

    // Get logged in user
    const user = req.user;

    // Validate form data
    const { subject, message, recaptcha } = authenticatedContactSchema.parse(req.body);

    // Process the contact request
    processContactRequest({
      name: user.username,
      email: user.email || 'No email provided',
      subject,
      message,
      userId: user.id,
      discordId: user.discordId,
      authenticated: true
    });

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Thank you for your message. We'll get back to you soon!"
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

    log(`Error processing authenticated contact form: ${error}`, 'contact');
    return res.status(500).json({
      success: false,
      message: "Failed to process your request. Please try again later."
    });
  }
}

/**
 * Handle contact form submissions from unauthenticated users
 */
export function handlePublicContact(req: Request, res: Response) {
  try {
    // Validate form data
    const { name, email, subject, message, recaptcha } = contactSchema.parse(req.body);

    // TODO: Add reCAPTCHA validation here
    // if (process.env.RECAPTCHA_SECRET_KEY) { ... }

    // Process the contact request
    processContactRequest({
      name,
      email,
      subject,
      message,
      authenticated: false
    });

    // Send success response
    return res.status(200).json({
      success: true,
      message: "Thank you for your message. We'll get back to you soon!"
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

    log(`Error processing public contact form: ${error}`, 'contact');
    return res.status(500).json({
      success: false,
      message: "Failed to process your request. Please try again later."
    });
  }
}

/**
 * Process a contact request
 * @param data The contact request data
 */
function processContactRequest(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: number;
  discordId?: string;
  authenticated: boolean;
}) {
  // Log the contact request
  log(`New contact form submission from ${data.name} (${data.email}): ${data.subject}`, 'contact');
  
  // TODO: Save to database or send email notification
  
  // Log details for monitoring
  const userInfo = data.authenticated 
    ? `User ID: ${data.userId}, Discord ID: ${data.discordId || 'None'}`
    : 'Unauthenticated user';
  
  logUpdate(`Contact form submission: ${data.subject} | From: ${data.name} | ${userInfo}`, 'contact');
}