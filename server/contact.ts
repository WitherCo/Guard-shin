/**
 * Contact Module
 * 
 * This module handles contact form submissions from the web dashboard
 * It provides endpoints to submit contact forms and process support requests
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { log } from './vite';
import { storage } from './storage';
import { logUpdate } from './update-logger';

// Contact form fields validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(150, "Subject must be less than 150 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
  userId: z.number().optional(),
  recaptchaToken: z.string().optional()
});

// Support request validation schema
const supportRequestSchema = z.object({
  userId: z.number(),
  category: z.string().min(2, "Category must be at least 2 characters"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(150, "Subject must be less than 150 characters"), 
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  attachments: z.array(z.string()).optional()
});

/**
 * Handle public contact form submissions
 */
export async function handlePublicContact(req: Request, res: Response) {
  try {
    // Validate the request data
    const validatedData = contactFormSchema.parse(req.body);
    
    // Log the contact form submission
    log(`Contact form submission from ${validatedData.name} (${validatedData.email}): ${validatedData.subject}`, 'contact');
    
    // TODO: In a real application, send an email or create a ticket in a support system
    // For now, we'll just log it

    // If user ID is provided, link the contact to a user account
    if (validatedData.userId) {
      const user = await storage.getUser(validatedData.userId);
      if (user) {
        log(`Contact form linked to user ${user.username} (${user.email}), ID: ${user.id}, Discord ID: ${user.discordId || 'None'}`, 'contact');
      }
    }
    
    // Log to webhook
    logUpdate(`Contact form submission - Subject: ${validatedData.subject}, From: ${validatedData.name} (${validatedData.email})`, 'contact');
    
    // Send success response
    res.status(200).json({
      success: true,
      message: "Your message has been received. We'll get back to you soon!"
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
    
    log(`Error processing contact form: ${error}`, 'error');
    res.status(500).json({
      success: false,
      message: "There was an error processing your request. Please try again later."
    });
  }
}

/**
 * Handle authenticated support requests
 * These come from logged-in users and are linked to their accounts
 */
export async function handleAuthenticatedContact(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to submit a support request."
      });
    }
    
    // Validate the request data
    const validatedData = supportRequestSchema.parse(req.body);
    
    // Ensure the user ID matches the authenticated user
    if (validatedData.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "User ID mismatch. You can only submit support requests for your own account."
      });
    }
    
    // Get the user
    const user = await storage.getUser(validatedData.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }
    
    // Log the support request
    log(`Support request from ${user.username} (${user.email}): ${validatedData.subject} (Priority: ${validatedData.priority})`, 'support');
    
    // TODO: In a real application, create a ticket in a support system
    // For now, we'll just log it
    
    // Log to webhook
    logUpdate(`Support request - Category: ${validatedData.category}, Subject: ${validatedData.subject}, Priority: ${validatedData.priority}, User: ${user.username} (ID: ${user.id})`, 'support');
    
    // Send success response
    res.status(200).json({
      success: true,
      message: "Your support request has been submitted. Our team will respond as soon as possible.",
      ticketId: `SR-${Date.now().toString(36).toUpperCase()}` // Generate a fake ticket ID
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
    
    log(`Error processing support request: ${error}`, 'error');
    res.status(500).json({
      success: false,
      message: "There was an error processing your request. Please try again later."
    });
  }
}