import { eq } from 'drizzle-orm';
import { db } from './db';
import { IStorage } from './storage';
import {
  users, type User, type InsertUser,
  servers, type Server, type InsertServer,
  autoModSettings, type AutoModSetting, type InsertAutoModSetting,
  raidProtectionSettings, type RaidProtectionSetting, type InsertRaidProtectionSetting,
  infractions, type Infraction, type InsertInfraction,
  verificationSettings, type VerificationSetting, type InsertVerificationSetting,
  welcomeMessageSettings, type WelcomeMessageSetting, type InsertWelcomeMessageSetting,
  welcomeImageSettings, type WelcomeImageSetting, type InsertWelcomeImageSetting,
  reactionRoles, type ReactionRole, type InsertReactionRole,
  autoRoleSettings, type AutoRoleSetting, type InsertAutoRoleSetting,
  loggingSettings, type LoggingSetting, type InsertLoggingSetting,
  userSubscriptions, type UserSubscription, type InsertUserSubscription,
  paymentTransactions, type PaymentTransaction, type InsertPaymentTransaction,
  WELCOME_STYLES, COLOR_THEMES, SubscriptionTier, PaymentStatus, PaymentMethod
} from "@shared/schema";

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

  async createDiscordUser(user: any): Promise<User> {
    const userData = {
      username: user.username,
      discordId: user.id,
      avatar: user.avatar,
      discordUsername: user.username,
      discriminator: user.discriminator,
      email: user.email,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      premiumType: user.premium_type || 0,
    };

    const existingUser = await this.getUserByDiscordId(user.id);
    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.discordId, user.id))
        .returning();
      return updatedUser;
    }

    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUserTokens(discordId: string, accessToken: string, refreshToken: string): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ accessToken, refreshToken })
      .where(eq(users.discordId, discordId));
    return !!result;
  }

  // Server methods
  async getServer(id: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }

  async getServers(): Promise<Server[]> {
    return await db.select().from(servers);
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const [server] = await db.insert(servers).values(insertServer).returning();
    return server;
  }

  async updateServer(id: string, serverUpdate: Partial<Server>): Promise<Server | undefined> {
    const [server] = await db
      .update(servers)
      .set(serverUpdate)
      .where(eq(servers.id, id))
      .returning();
    return server;
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

  async createAutoModSettings(insertSettings: InsertAutoModSetting): Promise<AutoModSetting> {
    const [settings] = await db
      .insert(autoModSettings)
      .values(insertSettings)
      .returning();
    return settings;
  }

  async updateAutoModSettings(serverId: string, settingsUpdate: Partial<AutoModSetting>): Promise<AutoModSetting | undefined> {
    const [settings] = await db
      .update(autoModSettings)
      .set(settingsUpdate)
      .where(eq(autoModSettings.serverId, serverId))
      .returning();
    return settings;
  }

  // Implement all other methods for the IStorage interface...
  // This is a partial implementation - add the remaining methods as needed

  async initializeDemoData(): Promise<void> {
    // Check if we already have data
    const userCount = await db.select().from(users).execute();
    if (userCount.length > 0) {
      console.log("Demo data already exists");
      return;
    }

    // Create demo user
    const demoUser = await this.createUser({
      username: "demo",
      password: "$2a$10$VfaGJvfj9qfpQG0UJJl9oe6I4nVnT8RHRyu4QwaKtjAzGtN7kmktq", // hashed "password"
      role: "admin"
    });

    // Create demo server
    const demoServer = await this.createServer({
      id: "123456789012345678",
      name: "Demo Server",
      icon: "https://via.placeholder.com/128",
      memberCount: 100,
      ownerId: "123456789012345678",
      premium: true,
      premiumTier: SubscriptionTier.PREMIUM
    });

    console.log("Demo data initialized");
  }
}
