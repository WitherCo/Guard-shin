import {
  users, type User, type InsertUser,
  servers, type Server, type InsertServer,
  autoModSettings, type AutoModSetting, type InsertAutoModSetting,
  raidProtectionSettings, type RaidProtectionSetting, type InsertRaidProtectionSetting,
  infractions, type Infraction, type InsertInfraction,
  verificationSettings, type VerificationSetting, type InsertVerificationSetting,
  welcomeMessageSettings, type WelcomeMessageSetting, type InsertWelcomeMessageSetting
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async createDiscordUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values({
      username: userData.username,
      discordId: userData.discordId,
      avatar: userData.avatar,
      discordUsername: userData.discordUsername,
      discriminator: userData.discriminator,
      email: userData.email,
      accessToken: userData.accessToken,
      refreshToken: userData.refreshToken,
      premiumType: userData.premiumType
    }).returning();
    return user;
  }
  
  async updateUserTokens(discordId: string, accessToken: string, refreshToken: string): Promise<boolean> {
    try {
      await db.update(users)
        .set({ 
          accessToken, 
          refreshToken 
        })
        .where(eq(users.discordId, discordId));
      return true;
    } catch (error) {
      console.error("Error updating user tokens:", error);
      return false;
    }
  }
  
  // Server methods
  async getServer(id: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }
  
  async getServers(): Promise<Server[]> {
    return await db.select().from(servers);
  }
  
  async createServer(server: InsertServer): Promise<Server> {
    const [newServer] = await db.insert(servers).values(server).returning();
    return newServer;
  }
  
  async updateServer(id: string, serverUpdate: Partial<Server>): Promise<Server | undefined> {
    const [updatedServer] = await db
      .update(servers)
      .set(serverUpdate)
      .where(eq(servers.id, id))
      .returning();
    return updatedServer;
  }
  
  async deleteServer(id: string): Promise<boolean> {
    const result = await db.delete(servers).where(eq(servers.id, id));
    return !!result;
  }
  
  // Auto-moderation settings
  async getAutoModSettings(serverId: string): Promise<AutoModSetting | undefined> {
    const [settings] = await db
      .select()
      .from(autoModSettings)
      .where(eq(autoModSettings.serverId, serverId));
    return settings;
  }
  
  async createAutoModSettings(settings: InsertAutoModSetting): Promise<AutoModSetting> {
    const [newSettings] = await db
      .insert(autoModSettings)
      .values(settings)
      .returning();
    return newSettings;
  }
  
  async updateAutoModSettings(serverId: string, settingsUpdate: Partial<AutoModSetting>): Promise<AutoModSetting | undefined> {
    const [updatedSettings] = await db
      .update(autoModSettings)
      .set(settingsUpdate)
      .where(eq(autoModSettings.serverId, serverId))
      .returning();
    return updatedSettings;
  }
  
  // Raid protection settings
  async getRaidProtectionSettings(serverId: string): Promise<RaidProtectionSetting | undefined> {
    const [settings] = await db
      .select()
      .from(raidProtectionSettings)
      .where(eq(raidProtectionSettings.serverId, serverId));
    return settings;
  }
  
  async createRaidProtectionSettings(settings: InsertRaidProtectionSetting): Promise<RaidProtectionSetting> {
    const [newSettings] = await db
      .insert(raidProtectionSettings)
      .values({
        ...settings,
        lockdownActivatedAt: settings.lockdownActive ? new Date() : null
      })
      .returning();
    return newSettings;
  }
  
  async updateRaidProtectionSettings(serverId: string, settingsUpdate: Partial<RaidProtectionSetting>): Promise<RaidProtectionSetting | undefined> {
    const [updatedSettings] = await db
      .update(raidProtectionSettings)
      .set(settingsUpdate)
      .where(eq(raidProtectionSettings.serverId, serverId))
      .returning();
    return updatedSettings;
  }
  
  // Infractions
  async getInfractions(serverId: string): Promise<Infraction[]> {
    return await db
      .select()
      .from(infractions)
      .where(eq(infractions.serverId, serverId));
  }
  
  async getInfraction(id: number): Promise<Infraction | undefined> {
    const [infraction] = await db
      .select()
      .from(infractions)
      .where(eq(infractions.id, id));
    return infraction;
  }
  
  async getUserInfractions(serverId: string, userId: string): Promise<Infraction[]> {
    return await db
      .select()
      .from(infractions)
      .where(
        and(
          eq(infractions.serverId, serverId),
          eq(infractions.userId, userId)
        )
      );
  }
  
  async createInfraction(infraction: InsertInfraction): Promise<Infraction> {
    const [newInfraction] = await db
      .insert(infractions)
      .values(infraction)
      .returning();
    return newInfraction;
  }
  
  async updateInfraction(id: number, infractionUpdate: Partial<Infraction>): Promise<Infraction | undefined> {
    const [updatedInfraction] = await db
      .update(infractions)
      .set(infractionUpdate)
      .where(eq(infractions.id, id))
      .returning();
    return updatedInfraction;
  }
  
  async deleteInfraction(id: number): Promise<boolean> {
    const result = await db.delete(infractions).where(eq(infractions.id, id));
    return !!result;
  }
  
  // Verification settings
  async getVerificationSettings(serverId: string): Promise<VerificationSetting | undefined> {
    const [settings] = await db
      .select()
      .from(verificationSettings)
      .where(eq(verificationSettings.serverId, serverId));
    return settings;
  }
  
  async createVerificationSettings(settings: InsertVerificationSetting): Promise<VerificationSetting> {
    const [newSettings] = await db
      .insert(verificationSettings)
      .values(settings)
      .returning();
    return newSettings;
  }
  
  async updateVerificationSettings(serverId: string, settingsUpdate: Partial<VerificationSetting>): Promise<VerificationSetting | undefined> {
    const [updatedSettings] = await db
      .update(verificationSettings)
      .set(settingsUpdate)
      .where(eq(verificationSettings.serverId, serverId))
      .returning();
    return updatedSettings;
  }

  // Welcome message settings
  async getWelcomeMessageSettings(serverId: string): Promise<WelcomeMessageSetting | undefined> {
    const [settings] = await db
      .select()
      .from(welcomeMessageSettings)
      .where(eq(welcomeMessageSettings.serverId, serverId));
    return settings;
  }
  
  async createWelcomeMessageSettings(settings: InsertWelcomeMessageSetting): Promise<WelcomeMessageSetting> {
    const [newSettings] = await db
      .insert(welcomeMessageSettings)
      .values(settings)
      .returning();
    return newSettings;
  }
  
  async updateWelcomeMessageSettings(serverId: string, settingsUpdate: Partial<WelcomeMessageSetting>): Promise<WelcomeMessageSetting | undefined> {
    const [updatedSettings] = await db
      .update(welcomeMessageSettings)
      .set(settingsUpdate)
      .where(eq(welcomeMessageSettings.serverId, serverId))
      .returning();
    return updatedSettings;
  }

  // Demo data initialization
  async initializeDemoData() {
    try {
      // Check if we already have a demo server
      const existingServers = await this.getServers();
      if (existingServers.length > 0) {
        return; // Already have data
      }

      // Add a demo server
      const server = await this.createServer({
        id: '123456789012345678',
        name: 'Guard-shin Test Server',
        icon: 'https://example.com/icon.png',
        memberCount: 2500,
        ownerId: '111111111111111111'
      });
      
      // Add demo auto-mod settings
      await this.createAutoModSettings({
        serverId: server.id,
        profanityFilterEnabled: true,
        spamDetectionEnabled: true,
        linkFilterEnabled: true,
        duplicateMessagesEnabled: false,
        mediaScanningEnabled: false,
        profanityWords: ['badword', 'anotherbadword'],
        spamThreshold: 5,
        spamTimeWindow: 5,
        allowedLinks: ['discord.com', 'youtube.com'],
        logChannelId: '222222222222222222'
      });
      
      // Add demo raid protection settings
      await this.createRaidProtectionSettings({
        serverId: server.id,
        enabled: true,
        joinRateThreshold: 20,
        joinRateTimeWindow: 60,
        autoLockdown: true,
        verificationLevel: 'HIGH',
        alertChannelId: '333333333333333333',
        lockdownActive: false
      });
      
      // Add demo infractions
      await this.createInfraction({
        serverId: server.id,
        userId: '444444444444444444',
        username: 'BadUser',
        moderatorId: '111111111111111111',
        moderatorName: 'AdminUser',
        type: 'WARNING',
        reason: 'Inappropriate language',
        active: true
      });
      
      await this.createInfraction({
        serverId: server.id,
        userId: '555555555555555555',
        username: 'AnotherUser',
        moderatorId: '111111111111111111',
        moderatorName: 'AdminUser',
        type: 'TIMEOUT',
        reason: 'Spamming',
        duration: 300, // 5 minutes
        active: true,
        expiresAt: new Date(Date.now() + 300 * 1000)
      });
      
      // Add demo verification settings
      await this.createVerificationSettings({
        serverId: server.id,
        enabled: true,
        verificationChannelId: '666666666666666666',
        verifiedRoleId: '777777777777777777',
        captchaRequired: true,
        minimumAccountAge: 7,
        logChannelId: '888888888888888888'
      });
      
      // Add demo welcome message settings
      await this.createWelcomeMessageSettings({
        serverId: server.id,
        enabled: true,
        welcomeChannelId: '999999999999999999',
        welcomeMessage: 'Welcome {user} to {server}! Please read our rules in <#888888888888888888>.',
        embedEnabled: true,
        embedColor: '#5865F2',
        embedTitle: 'Welcome to {server}',
        embedDescription: 'Thanks for joining our community! We now have {memberCount} members!',
        embedThumbnail: true,
        embedImage: 'https://example.com/welcome-banner.png',
        embedFooter: 'Powered by Guard-shin',
        dmWelcomeEnabled: true,
        dmWelcomeMessage: 'Thanks for joining {server}! We hope you enjoy your stay.',
        autoRoleEnabled: true,
        autoRoleIds: ['101010101010101010']
      });
    } catch (error) {
      console.error("Error initializing demo data:", error);
    }
  }
}