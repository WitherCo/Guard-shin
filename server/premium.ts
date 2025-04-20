import { Request, Response } from 'express';
import { log } from './vite';
import { Client } from 'discord.js';
import { isAuthenticated } from './auth';

// Support server ID from the bot configuration
const SUPPORT_SERVER_ID = '1233495879223345172';

// Constant support server ID - this is the only server that should have premium access
const PREMIUM_SERVER_ID = SUPPORT_SERVER_ID;

/**
 * Check if a server has premium status
 * @param req Request with serverId param
 * @param res Response containing premium status
 */
export async function checkServerPremium(req: Request, res: Response) {
  try {
    const { serverId } = req.params;
    
    // Check if the server ID matches the support server ID
    const isPremium = serverId === PREMIUM_SERVER_ID;
    
    res.json({
      isPremium,
      premiumTier: isPremium ? 2 : 0,
      // For the support server, we'll set a long expiry
      expiresAt: isPremium ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : null
    });
  } catch (error) {
    log(`Error checking server premium status: ${error}`, 'discord');
    res.status(500).json({ error: 'Failed to check premium status' });
  }
}

/**
 * Check if current user has premium status
 * @param req Request with authenticated user
 * @param res Response containing premium status
 */
export async function checkUserPremium(req: Request, res: Response) {
  try {
    // Get the user's Discord guilds from session
    const discordGuilds = (req.session as any).discordGuilds || [];
    
    // Define guild interface to fix TypeScript error
    interface DiscordGuild {
      id: string;
      name?: string;
      [key: string]: any;
    }
    
    // Check if the user is a member of the support server
    const isPremium = discordGuilds.some((guild: DiscordGuild) => guild.id === PREMIUM_SERVER_ID);
    
    res.json({
      isPremium,
      premiumTier: isPremium ? 1 : 0,
      expiresAt: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
    });
  } catch (error) {
    log(`Error checking user premium status: ${error}`, 'discord');
    res.status(500).json({ error: 'Failed to check premium status' });
  }
}

/**
 * Register premium-related routes
 * @param app Express application
 */
export function registerPremiumRoutes(app: any) {
  // Check if a server has premium status
  app.get('/api/premium/server/:serverId', isAuthenticated, checkServerPremium);
  
  // Check if the current user has premium status
  app.get('/api/premium/user', isAuthenticated, checkUserPremium);
}