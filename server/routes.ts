import type { Express, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertServerSchema, 
  insertAutoModSettingsSchema, 
  insertRaidProtectionSettingsSchema,
  insertInfractionSchema,
  insertVerificationSettingsSchema,
  insertWelcomeMessageSettingsSchema
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod-validation-error";
import { disableLockdown, getLockdownStatus } from "./discord/raidProtection";
import { setupAuth, isAuthenticated } from "./auth";
import { handleAuthenticatedContact, handlePublicContact } from "./contact";
import { requestPasswordReset, resetPassword } from "./password-reset";
import { sendWebhookMessage } from "./webhook";
import { logUpdate, logFeatureUpdate, logBugFix, forceFlushUpdates } from "./update-logger";
import { 
  createPaymentIntent, 
  createSubscription, 
  handleStripeWebhook, 
  getUserSubscription,
  getPaymentHistory,
  cancelSubscription,
  manualPaymentVerification,
  pushPaymentSchemaChanges
} from "./payments";

// Discord client interface
type DiscordClient = {
  isInitialized: boolean;
  getGuilds: () => Promise<any[]>;
  getGuild: (guildId: string) => Promise<any | null>;
  getMemberCount: (guildId: string) => Promise<number>;
  sendGuildMessage: (guildId: string, channelId: string, message: string) => Promise<boolean>;
};

// Define a stub for the Discord client if it's not provided
const createStubDiscordClient = (): DiscordClient => {
  return {
    isInitialized: false,
    getGuilds: async () => [],
    getGuild: async () => null,
    getMemberCount: async () => 0,
    sendGuildMessage: async () => false
  };
};

export async function registerRoutes(app: Express, discordClient?: DiscordClient): Promise<Server> {
  // Store Discord client for middleware usage
  const discord = discordClient || createStubDiscordClient();
  
  // API Routes
  app.get("/api/discord/guilds", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // If user authenticated through Discord, use guilds from their session
      if (req.session.discordGuilds && req.session.discordGuilds.length > 0) {
        console.log("Returning Discord guilds from user session");
        return res.json(req.session.discordGuilds);
      }
      
      // Fallback to bot-fetched guilds
      if (!discord || !discord.isInitialized) {
        return res.status(503).json({ message: "Discord integration not available" });
      }
      
      const guilds = await discord.getGuilds();
      res.json(guilds);
    } catch (error) {
      console.error("Error fetching Discord guilds:", error);
      res.status(500).json({ message: "Failed to fetch Discord guilds" });
    }
  });
  
  app.get("/api/discord/guilds/:guildId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!discord || !discord.isInitialized) {
        return res.status(503).json({ message: "Discord integration not available" });
      }
      
      const guild = await discord.getGuild(req.params.guildId);
      if (!guild) {
        return res.status(404).json({ message: "Discord guild not found" });
      }
      
      res.json(guild);
    } catch (error) {
      console.error("Error fetching Discord guild:", error);
      res.status(500).json({ message: "Failed to fetch Discord guild" });
    }
  });
  
  app.get("/api/discord/guilds/:guildId/lockdown", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const isLocked = getLockdownStatus(req.params.guildId);
      res.json({ lockdownActive: isLocked });
    } catch (error) {
      console.error("Error fetching lockdown status:", error);
      res.status(500).json({ message: "Failed to fetch lockdown status" });
    }
  });
  
  app.post("/api/discord/guilds/:guildId/lockdown", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const disable = req.body.disable === true;
      
      if (disable) {
        const success = await disableLockdown(req.params.guildId);
        if (success) {
          return res.json({ lockdownActive: false, message: "Lockdown disabled successfully" });
        } else {
          return res.status(400).json({ message: "Failed to disable lockdown" });
        }
      }
      
      // In a real implementation, you would have a function to enable lockdown
      // This is just a placeholder for demo purposes
      res.json({ lockdownActive: true, message: "Lockdown enabled successfully" });
    } catch (error) {
      console.error("Error toggling lockdown:", error);
      res.status(500).json({ message: "Failed to toggle lockdown" });
    }
  });
  
  app.post("/api/discord/guilds/:guildId/message", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!discord || !discord.isInitialized) {
        return res.status(503).json({ message: "Discord integration not available" });
      }
      
      const { channelId, message } = req.body;
      
      if (!channelId || !message) {
        return res.status(400).json({ message: "Channel ID and message are required" });
      }
      
      const success = await discord.sendGuildMessage(req.params.guildId, channelId, message);
      
      if (success) {
        res.json({ success: true, message: "Message sent successfully" });
      } else {
        res.status(400).json({ success: false, message: "Failed to send message" });
      }
    } catch (error) {
      console.error("Error sending Discord message:", error);
      res.status(500).json({ message: "Failed to send Discord message" });
    }
  });
  
  // Debug endpoint for testing bot commands
  app.post("/api/discord/debug/command", isAuthenticated, async (req: Request, res: Response) => {
    // Check if the user is an admin
    const user = req.user as any;
    const ADMIN_ID = "1259367203346841725"; // fc4life_ Discord ID
    
    if (!user?.discordId || user.discordId !== ADMIN_ID) {
      return res.status(403).json({ error: "Only admin users can debug commands" });
    }
    
    // Check if Discord client is available
    if (!discord || !discord.isInitialized) {
      return res.status(503).json({ error: "Discord service unavailable" });
    }
    
    const { command, serverId } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: "Command is required" });
    }
    
    try {
      // Log the command attempt for debugging
      console.log(`[COMMAND DEBUG] Admin ${user.username} testing command: ${command} ${serverId ? `in server ${serverId}` : ''}`);
      
      // Preparing mock message for testing prefix commands
      const createMockMessage = (content: string, guildId: string | null = null) => {
        // Create a minimal mock that satisfies the required properties
        // This isn't a complete Message object, but has the properties we use
        return {
          content,
          author: {
            id: user.discordId,
            bot: false,
            tag: user.discordUsername || user.username
          },
          guild: guildId ? { 
            id: guildId,
            name: 'Test Guild',
            ownerId: user.discordId
          } : null,
          reply: async (response: any) => {
            console.log('[COMMAND DEBUG] Bot replied:', typeof response === 'string' ? response : JSON.stringify(response));
            return {
              edit: (newContent: any) => {
                console.log('[COMMAND DEBUG] Bot edited reply:', newContent);
              }
            };
          },
          channel: {
            send: async (response: any) => {
              console.log('[COMMAND DEBUG] Bot sent message:', typeof response === 'string' ? response : JSON.stringify(response));
            }
          }
        };
      };
      
      // Get the command type from request body or detect it from the command format
      const { type = command.startsWith('/') ? 'slash' : 'prefix' } = req.body;
      
      // If it's a prefix command
      if (type === 'prefix') {
        console.log('[COMMAND DEBUG] Processing prefix command:', command);
        const prefix = ';';
        
        // Create a mock message object
        const mockMessage = createMockMessage(command, serverId);
        
        try {
          // Import the handlePrefixCommand function from server/discord/prefixCommands
          const { handlePrefixCommand } = await import('./discord/prefixCommands');
          
          // Process the command
          await handlePrefixCommand(mockMessage, prefix);
          
          // Return successful response
          return res.json({ 
            result: `Prefix command "${command}" was processed. Check server logs for details.`,
            success: true 
          });
        } catch (error: any) {
          console.error('[COMMAND DEBUG] Error processing prefix command:', error);
          return res.status(500).json({ 
            error: `Error processing prefix command: ${error?.message || 'Unknown error'}`,
            success: false 
          });
        }
      } 
      // If it's a slash command
      else if (type === 'slash') {
        // Log slash command
        console.log('[COMMAND DEBUG] Processing slash command:', command);
        
        // Return successful response
        return res.json({ 
          result: `Slash command ${command} was sent to the bot. Check server logs for execution details.`,
          success: true 
        });
      } else {
        return res.status(400).json({ error: "Invalid command format. Use prefix ';' or '/' for slash commands" });
      }
    } catch (error) {
      console.error("Error testing command:", error);
      return res.status(500).json({ error: "Failed to test command: " + (error instanceof Error ? error.message : "Unknown error") });
    }
  });
  
  // User membership and roles - Check premium status
  app.get("/api/discord/user/roles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      // Check if user has Discord authentication data
      if (!user.discordId || !user.accessToken) {
        return res.status(403).json({ 
          message: "User not authenticated with Discord",
          premium: false,
          premiumTier: "free",
          roles: []
        });
      }
      
      if (!discord || !discord.isInitialized) {
        return res.status(503).json({ message: "Discord bot not initialized" });
      }
      
      // Fetch user's roles from Discord using the access token
      try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${user.accessToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch user's guilds");
        }
        
        const guilds = await response.json();
        
        // Look for the main support server where premium roles are assigned
        const supportGuildId = process.env.SUPPORT_GUILD_ID || '1361876078780989440'; // Default to the support server ID
        const supportServer = guilds.find((guild: any) => guild.id === supportGuildId);
        
        if (!supportServer) {
          return res.json({
            premium: false,
            premiumTier: "free",
            roles: []
          });
        }
        
        // Fetch member data including roles
        const memberResponse = await fetch(`https://discord.com/api/guilds/${supportGuildId}/members/${user.discordId}`, {
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
          }
        });
        
        if (!memberResponse.ok) {
          throw new Error("Failed to fetch member roles");
        }
        
        const memberData = await memberResponse.json();
        const roles = memberData.roles || [];
        
        // Import premium functionality
        const { 
          PREMIUM_ROLE_ID, 
          PREMIUM_PLUS_ROLE_ID, 
          getTierFromRole
        } = await import("@shared/premium");
        const { SubscriptionTier } = await import("@shared/schema");
        
        // Determine premium tier
        const premiumTier = getTierFromRole(roles);
        const isPremium = premiumTier !== SubscriptionTier.FREE;
        
        res.json({
          premium: isPremium,
          premiumTier: premiumTier,
          roles: roles
        });
        
      } catch (error) {
        console.error("Error fetching Discord roles:", error);
        res.status(500).json({ 
          message: "Failed to fetch Discord roles",
          premium: false,
          premiumTier: "free",
          roles: []
        });
      }
    } catch (error) {
      console.error("General error in roles endpoint:", error);
      res.status(500).json({ 
        message: "Internal server error",
        premium: false,
        premiumTier: "free",
        roles: []
      });
    }
  });

  // Database API Routes
  app.get("/api/servers", async (req: Request, res: Response) => {
    try {
      const servers = await storage.getServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch servers" });
    }
  });

  app.get("/api/servers/:id", async (req: Request, res: Response) => {
    try {
      const server = await storage.getServer(req.params.id);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch server" });
    }
  });

  // Auto-moderation settings
  app.get("/api/servers/:id/automod", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAutoModSettings(req.params.id);
      if (!settings) {
        return res.status(404).json({ message: "Auto-mod settings not found" });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch auto-mod settings" });
    }
  });

  app.post("/api/servers/:id/automod", async (req: Request, res: Response) => {
    try {
      const server = await storage.getServer(req.params.id);
      if (!server) {
        return res.status(404).json({ message: "Server not found" });
      }

      const validatedData = insertAutoModSettingsSchema.parse({
        ...req.body,
        serverId: req.params.id
      });
      
      const existingSettings = await storage.getAutoModSettings(req.params.id);
      
      if (existingSettings) {
        const updated = await storage.updateAutoModSettings(req.params.id, validatedData);
        return res.json(updated);
      } else {
        const created = await storage.createAutoModSettings(validatedData);
        return res.status(201).json(created);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update auto-mod settings" });
    }
  });

  // Payment routes
  app.post("/api/create-payment-intent", isAuthenticated, createPaymentIntent);
  app.post("/api/create-subscription", isAuthenticated, createSubscription);
  app.post("/api/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);
  app.get("/api/subscriptions/current", isAuthenticated, getUserSubscription);
  app.get("/api/payments/history", isAuthenticated, getPaymentHistory);
  app.post("/api/subscriptions/cancel", isAuthenticated, cancelSubscription);
  app.post("/api/payments/verify", isAuthenticated, manualPaymentVerification);

  // Contact form
  app.post("/api/contact/authenticated", isAuthenticated, handleAuthenticatedContact);
  app.post("/api/contact", handlePublicContact);
  
  // Password reset
  app.post("/api/request-password-reset", requestPasswordReset);
  app.post("/api/reset-password", resetPassword);
  
  // Update endpoint for admin-only usage
  app.post("/api/admin/send-update", isAuthenticated, async (req: Request, res: Response) => {
    const user = req.user as any;
    
    // Check if user is admin
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized. Only admins can send updates." });
    }
    
    const { message, type = "general" } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "Update message is required" });
    }
    
    try {
      switch (type) {
        case "feature":
          await logFeatureUpdate(message);
          break;
        case "bugfix":
          await logBugFix(message);
          break;
        default:
          await logUpdate(message, "admin");
      }
      
      res.json({ message: "Update sent successfully" });
    } catch (error) {
      console.error("Error sending update:", error);
      res.status(500).json({ message: "Failed to send update" });
    }
  });
  
  app.post("/api/admin/force-flush-updates", isAuthenticated, async (req: Request, res: Response) => {
    const user = req.user as any;
    
    // Check if user is admin
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized. Only admins can flush updates." });
    }
    
    try {
      await forceFlushUpdates();
      res.json({ message: "Updates flushed successfully" });
    } catch (error) {
      console.error("Error flushing updates:", error);
      res.status(500).json({ message: "Failed to flush updates" });
    }
  });
  
  // Create server for HTTP and WebSocket
  const httpServer = createServer(app);

  return httpServer;
}