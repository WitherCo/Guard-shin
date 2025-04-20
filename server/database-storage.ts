/**
 * Database Storage Implementation
 * 
 * This module provides the database-backed implementation of the storage interface.
 * It handles all database operations for the application using Drizzle ORM.
 */

import { db } from './db';
import { IStorage } from './storage';
import { hash, compare } from 'bcryptjs';
import { eq, and, like, desc } from 'drizzle-orm';
import { 
  users, User, InsertUser, 
  servers, Server, InsertServer,
  autoModSettings, AutoModSetting, InsertAutoModSetting,
  raidProtectionSettings, RaidProtectionSetting, InsertRaidProtectionSetting,
  infractions, Infraction, InsertInfraction, 
  verificationSettings, VerificationSetting, InsertVerificationSetting,
  welcomeMessageSettings, WelcomeMessageSetting, InsertWelcomeMessageSetting,
  userSubscriptions, UserSubscription, InsertUserSubscription,
  paymentTransactions, PaymentTransaction, InsertPaymentTransaction
} from '@shared/schema';

// Salt rounds for password hashing
const SALT_ROUNDS = 10;

/**
 * Database Storage class implementing the IStorage interface
 * Provides methods to interact with the database using Drizzle ORM
 */
export class DatabaseStorage implements IStorage {
  /**
   * User Methods
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return undefined;
    }
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
      return user;
    } catch (error) {
      console.error('Error fetching user by Discord ID:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Hash password if provided
      if (insertUser.password) {
        insertUser.password = await hash(insertUser.password, SALT_ROUNDS);
      }

      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createDiscordUser(userData: any): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByDiscordId(userData.id);
      if (existingUser) {
        // Update tokens
        await this.updateUserTokens(
          userData.id,
          userData.accessToken,
          userData.refreshToken
        );
        return existingUser;
      }

      // Create new user
      const insertData: InsertUser = {
        username: userData.username,
        discordId: userData.id,
        avatar: userData.avatar,
        discordUsername: userData.username,
        discriminator: userData.discriminator || '0',
        email: userData.email,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
        premiumType: userData.premium_type || 0,
      };

      const [user] = await db.insert(users).values(insertData).returning();
      return user;
    } catch (error) {
      console.error('Error creating Discord user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      // Hash password if provided
      if (userData.password) {
        userData.password = await hash(userData.password, SALT_ROUNDS);
      }

      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async updateUserTokens(discordId: string, accessToken: string, refreshToken: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({
          accessToken,
          refreshToken,
        })
        .where(eq(users.discordId, discordId));

      return true;
    } catch (error) {
      console.error('Error updating user tokens:', error);
      return false;
    }
  }

  async updateUserPassword(id: number, newPassword: string): Promise<boolean> {
    try {
      const hashedPassword = await hash(newPassword, SALT_ROUNDS);
      
      await db
        .update(users)
        .set({
          password: hashedPassword,
        })
        .where(eq(users.id, id));

      return true;
    } catch (error) {
      console.error('Error updating user password:', error);
      return false;
    }
  }

  /**
   * Server Methods
   */
  async getServer(id: string): Promise<Server | undefined> {
    try {
      const [server] = await db.select().from(servers).where(eq(servers.id, id));
      return server;
    } catch (error) {
      console.error('Error fetching server:', error);
      return undefined;
    }
  }

  async getServers(): Promise<Server[]> {
    try {
      return await db.select().from(servers);
    } catch (error) {
      console.error('Error fetching servers:', error);
      return [];
    }
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    try {
      const [server] = await db.insert(servers).values(insertServer).returning();
      return server;
    } catch (error) {
      console.error('Error creating server:', error);
      throw error;
    }
  }

  async updateServer(id: string, serverUpdate: Partial<Server>): Promise<Server | undefined> {
    try {
      const [updatedServer] = await db
        .update(servers)
        .set(serverUpdate)
        .where(eq(servers.id, id))
        .returning();

      return updatedServer;
    } catch (error) {
      console.error('Error updating server:', error);
      return undefined;
    }
  }

  async deleteServer(id: string): Promise<boolean> {
    try {
      const [deletedServer] = await db
        .delete(servers)
        .where(eq(servers.id, id))
        .returning();

      return !!deletedServer;
    } catch (error) {
      console.error('Error deleting server:', error);
      return false;
    }
  }

  /**
   * Auto-Moderation Settings Methods
   */
  async getAutoModSettings(serverId: string): Promise<AutoModSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(autoModSettings)
        .where(eq(autoModSettings.serverId, serverId));

      return settings;
    } catch (error) {
      console.error('Error fetching auto-mod settings:', error);
      return undefined;
    }
  }

  async createAutoModSettings(settings: InsertAutoModSetting): Promise<AutoModSetting> {
    try {
      const [createdSettings] = await db
        .insert(autoModSettings)
        .values(settings)
        .returning();

      return createdSettings;
    } catch (error) {
      console.error('Error creating auto-mod settings:', error);
      throw error;
    }
  }

  async updateAutoModSettings(serverId: string, settingsUpdate: Partial<AutoModSetting>): Promise<AutoModSetting | undefined> {
    try {
      const [updatedSettings] = await db
        .update(autoModSettings)
        .set(settingsUpdate)
        .where(eq(autoModSettings.serverId, serverId))
        .returning();

      return updatedSettings;
    } catch (error) {
      console.error('Error updating auto-mod settings:', error);
      return undefined;
    }
  }

  /**
   * Raid Protection Settings Methods
   */
  async getRaidProtectionSettings(serverId: string): Promise<RaidProtectionSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(raidProtectionSettings)
        .where(eq(raidProtectionSettings.serverId, serverId));

      return settings;
    } catch (error) {
      console.error('Error fetching raid protection settings:', error);
      return undefined;
    }
  }

  async createRaidProtectionSettings(settings: InsertRaidProtectionSetting): Promise<RaidProtectionSetting> {
    try {
      const [createdSettings] = await db
        .insert(raidProtectionSettings)
        .values(settings)
        .returning();

      return createdSettings;
    } catch (error) {
      console.error('Error creating raid protection settings:', error);
      throw error;
    }
  }

  async updateRaidProtectionSettings(serverId: string, settingsUpdate: Partial<RaidProtectionSetting>): Promise<RaidProtectionSetting | undefined> {
    try {
      const [updatedSettings] = await db
        .update(raidProtectionSettings)
        .set(settingsUpdate)
        .where(eq(raidProtectionSettings.serverId, serverId))
        .returning();

      return updatedSettings;
    } catch (error) {
      console.error('Error updating raid protection settings:', error);
      return undefined;
    }
  }

  /**
   * Infractions Methods
   */
  async getInfractions(serverId: string): Promise<Infraction[]> {
    try {
      return await db
        .select()
        .from(infractions)
        .where(eq(infractions.serverId, serverId))
        .orderBy(desc(infractions.createdAt));
    } catch (error) {
      console.error('Error fetching infractions:', error);
      return [];
    }
  }

  async getInfraction(id: number): Promise<Infraction | undefined> {
    try {
      const [infraction] = await db
        .select()
        .from(infractions)
        .where(eq(infractions.id, id));

      return infraction;
    } catch (error) {
      console.error('Error fetching infraction:', error);
      return undefined;
    }
  }

  async getUserInfractions(serverId: string, userId: string): Promise<Infraction[]> {
    try {
      return await db
        .select()
        .from(infractions)
        .where(and(
          eq(infractions.serverId, serverId),
          eq(infractions.userId, userId)
        ))
        .orderBy(desc(infractions.createdAt));
    } catch (error) {
      console.error('Error fetching user infractions:', error);
      return [];
    }
  }

  async createInfraction(infraction: InsertInfraction): Promise<Infraction> {
    try {
      const [createdInfraction] = await db
        .insert(infractions)
        .values(infraction)
        .returning();

      return createdInfraction;
    } catch (error) {
      console.error('Error creating infraction:', error);
      throw error;
    }
  }

  async updateInfraction(id: number, infractionUpdate: Partial<Infraction>): Promise<Infraction | undefined> {
    try {
      const [updatedInfraction] = await db
        .update(infractions)
        .set(infractionUpdate)
        .where(eq(infractions.id, id))
        .returning();

      return updatedInfraction;
    } catch (error) {
      console.error('Error updating infraction:', error);
      return undefined;
    }
  }

  async deleteInfraction(id: number): Promise<boolean> {
    try {
      const [deletedInfraction] = await db
        .delete(infractions)
        .where(eq(infractions.id, id))
        .returning();

      return !!deletedInfraction;
    } catch (error) {
      console.error('Error deleting infraction:', error);
      return false;
    }
  }

  /**
   * Verification Settings Methods
   */
  async getVerificationSettings(serverId: string): Promise<VerificationSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(verificationSettings)
        .where(eq(verificationSettings.serverId, serverId));

      return settings;
    } catch (error) {
      console.error('Error fetching verification settings:', error);
      return undefined;
    }
  }

  async createVerificationSettings(settings: InsertVerificationSetting): Promise<VerificationSetting> {
    try {
      const [createdSettings] = await db
        .insert(verificationSettings)
        .values(settings)
        .returning();

      return createdSettings;
    } catch (error) {
      console.error('Error creating verification settings:', error);
      throw error;
    }
  }

  async updateVerificationSettings(serverId: string, settingsUpdate: Partial<VerificationSetting>): Promise<VerificationSetting | undefined> {
    try {
      const [updatedSettings] = await db
        .update(verificationSettings)
        .set(settingsUpdate)
        .where(eq(verificationSettings.serverId, serverId))
        .returning();

      return updatedSettings;
    } catch (error) {
      console.error('Error updating verification settings:', error);
      return undefined;
    }
  }

  /**
   * Welcome Message Settings Methods
   */
  async getWelcomeMessageSettings(serverId: string): Promise<WelcomeMessageSetting | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(welcomeMessageSettings)
        .where(eq(welcomeMessageSettings.serverId, serverId));

      return settings;
    } catch (error) {
      console.error('Error fetching welcome message settings:', error);
      return undefined;
    }
  }

  async createWelcomeMessageSettings(settings: InsertWelcomeMessageSetting): Promise<WelcomeMessageSetting> {
    try {
      const [createdSettings] = await db
        .insert(welcomeMessageSettings)
        .values(settings)
        .returning();

      return createdSettings;
    } catch (error) {
      console.error('Error creating welcome message settings:', error);
      throw error;
    }
  }

  async updateWelcomeMessageSettings(serverId: string, settingsUpdate: Partial<WelcomeMessageSetting>): Promise<WelcomeMessageSetting | undefined> {
    try {
      const [updatedSettings] = await db
        .update(welcomeMessageSettings)
        .set(settingsUpdate)
        .where(eq(welcomeMessageSettings.serverId, serverId))
        .returning();

      return updatedSettings;
    } catch (error) {
      console.error('Error updating welcome message settings:', error);
      return undefined;
    }
  }

  /**
   * Payment and Subscription Methods
   */
  async getUserSubscription(userId: number): Promise<UserSubscription | undefined> {
    try {
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, userId));

      return subscription;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return undefined;
    }
  }

  async getUserSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | undefined> {
    try {
      const [subscription] = await db
        .select()
        .from(userSubscriptions)
        .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId));

      return subscription;
    } catch (error) {
      console.error('Error fetching user subscription by Stripe ID:', error);
      return undefined;
    }
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    try {
      const [createdSubscription] = await db
        .insert(userSubscriptions)
        .values(subscription)
        .returning();

      return createdSubscription;
    } catch (error) {
      console.error('Error creating user subscription:', error);
      throw error;
    }
  }

  async updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription | undefined> {
    try {
      const [updatedSubscription] = await db
        .update(userSubscriptions)
        .set(data)
        .where(eq(userSubscriptions.id, id))
        .returning();

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return undefined;
    }
  }

  async getPaymentTransactionsByUserId(userId: number): Promise<PaymentTransaction[]> {
    try {
      return await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.userId, userId))
        .orderBy(desc(paymentTransactions.createdAt));
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      return [];
    }
  }

  async createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction> {
    try {
      const [createdTransaction] = await db
        .insert(paymentTransactions)
        .values(transaction)
        .returning();

      return createdTransaction;
    } catch (error) {
      console.error('Error creating payment transaction:', error);
      throw error;
    }
  }

  async updatePaymentTransactionByTransactionId(transactionId: string, data: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined> {
    try {
      const [updatedTransaction] = await db
        .update(paymentTransactions)
        .set(data)
        .where(eq(paymentTransactions.paymentIntentId, transactionId))
        .returning();

      return updatedTransaction;
    } catch (error) {
      console.error('Error updating payment transaction:', error);
      return undefined;
    }
  }

  /**
   * Stripe-related methods
   */
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error('Error updating Stripe customer ID:', error);
      return undefined;
    }
  }

  async updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error('Error updating user Stripe info:', error);
      return undefined;
    }
  }

  /**
   * Password update method
   */
  async updatePassword(id: number, newPassword: string): Promise<boolean> {
    return this.updateUserPassword(id, newPassword);
  }
}