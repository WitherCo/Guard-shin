import { Request, Response } from 'express';
import { z } from 'zod';
import { sendContactFormEmail } from './email';
import { log } from './vite';

// Form schema with validation
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const handleContactFormSubmission = async (req: Request, res: Response) => {
  try {
    // Validate form data
    const data = contactFormSchema.parse(req.body);
    
    // Log the submission for development purposes
    log('Contact form submission received:', 'contact');
    log(`From: ${data.name} (${data.email})`, 'contact');
    log(`Subject: ${data.subject}`, 'contact');
    log(`Message: ${data.message.substring(0, 100)}${data.message.length > 100 ? '...' : ''}`, 'contact');
    
    // Send the contact form email
    const emailSent = await sendContactFormEmail(
      data.name,
      data.email,
      data.subject,
      data.message
    );
    
    if (!emailSent) {
      // If email failed to send, log it but don't tell the user
      log('Failed to send contact form email', 'contact');
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Message received. We will contact you soon.' 
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid form data', 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'There was a problem processing your message. Please try again.' 
    });
  }
};