import { Request, Response } from 'express';
import { z } from 'zod';
import { log } from './vite';

// Define the schema for webhook data validation
const webhookSchema = z.object({
  webhookUrl: z.string().url({ message: 'Please enter a valid Discord webhook URL' }),
  username: z.string().min(1, { message: 'Username is required' }).max(80),
  message: z.string().min(1, { message: 'Message is required' }).max(2000),
  avatarUrl: z.string().url({ message: 'Please enter a valid avatar URL' }).optional().or(z.literal('')),
  embedEnabled: z.boolean().default(false),
  embedTitle: z.string().max(256).optional(),
  embedDescription: z.string().max(4096).optional(),
  embedColor: z.string().regex(/^#([0-9A-F]{6})$/i, { 
    message: 'Please enter a valid hex color code (e.g., #FF5733)' 
  }).optional().or(z.literal('')),
});

type WebhookData = z.infer<typeof webhookSchema>;

/**
 * Convert hex color to decimal value for Discord embed
 */
function hexToDecimal(hex: string): number {
  // Remove # if present
  hex = hex.replace('#', '');
  // Convert hex to decimal
  return parseInt(hex, 16);
}

/**
 * Send a message via Discord webhook
 */
export async function sendWebhookMessage(req: Request, res: Response) {
  try {
    // Validate request body
    const validationResult = webhookSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Invalid request data',
        errors: validationResult.error.errors,
      });
    }

    const webhookData: WebhookData = validationResult.data;
    
    // Prepare the webhook payload
    const payload: any = {
      username: webhookData.username,
      content: webhookData.message,
    };
    
    // Add avatar URL if provided
    if (webhookData.avatarUrl) {
      payload.avatar_url = webhookData.avatarUrl;
    }
    
    // Add embed if enabled
    if (webhookData.embedEnabled) {
      payload.embeds = [];
      
      // Only add embed if at least one embed field is provided
      if (webhookData.embedTitle || webhookData.embedDescription) {
        const embed: any = {};
        
        if (webhookData.embedTitle) {
          embed.title = webhookData.embedTitle;
        }
        
        if (webhookData.embedDescription) {
          embed.description = webhookData.embedDescription;
        }
        
        if (webhookData.embedColor) {
          embed.color = hexToDecimal(webhookData.embedColor);
        }
        
        // Add timestamp to embed
        embed.timestamp = new Date().toISOString();
        
        // Add footer
        embed.footer = {
          text: 'Sent via Guard-shin Dashboard',
        };
        
        payload.embeds.push(embed);
      }
    }
    
    // Send the webhook request
    log(`Sending webhook message to ${webhookData.webhookUrl}`, 'webhook');
    
    const response = await fetch(webhookData.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      // Handle Discord API specific errors
      if (response.status === 404) {
        return res.status(404).json({
          message: 'Webhook not found. Please check the webhook URL and try again.',
        });
      } else if (response.status === 429) {
        return res.status(429).json({
          message: 'Rate limited by Discord. Please try again later.',
        });
      }
      
      const errorText = await response.text();
      return res.status(response.status).json({
        message: `Discord webhook error: ${errorText || response.statusText}`,
      });
    }
    
    log('Webhook message sent successfully', 'webhook');
    
    return res.status(200).json({
      message: 'Webhook message sent successfully',
    });
  } catch (error) {
    log(`Error sending webhook message: ${error}`, 'webhook');
    
    return res.status(500).json({
      message: 'An error occurred while sending the webhook message',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}