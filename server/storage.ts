/**
 * Storage Interface Module
 * 
 * This module provides the storage interface for the application.
 * It defines the interface for data access and provides a concrete implementation.
 */

import { 
  User, InsertUser, Server, InsertServer, AutoModSetting, InsertAutoModSetting,
  RaidProtectionSetting, InsertRaidProtectionSetting, Infraction, InsertInfraction,
  VerificationSetting, InsertVerificationSetting, WelcomeMessageSetting, InsertWelcomeMessageSetting,
  UserSubscription, InsertUserSubscription, PaymentTransaction, InsertPaymentTransaction
} from '@shared/schema';
import { DatabaseStorage } from './database-storage';

/**
 * Interface for storage operations
 */
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  createDiscordUser(userData: any): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  updateUserTokens(discordId: string, accessToken: string, refreshToken: string): Promise<boolean>;
  updateUserPassword(id: number, newPassword: string): Promise<boolean>;
  
  // Server methods
  getServer(id: string): Promise<Server | undefined>;
  getServers(): Promise<Server[]>;
  createServer(insertServer: InsertServer): Promise<Server>;
  updateServer(id: string, serverUpdate: Partial<Server>): Promise<Server | undefined>;
  deleteServer(id: string): Promise<boolean>;
  
  // Auto-moderation settings methods
  getAutoModSettings(serverId: string): Promise<AutoModSetting | undefined>;
  createAutoModSettings(settings: InsertAutoModSetting): Promise<AutoModSetting>;
  updateAutoModSettings(serverId: string, settingsUpdate: Partial<AutoModSetting>): Promise<AutoModSetting | undefined>;
  
  // Raid protection settings methods
  getRaidProtectionSettings(serverId: string): Promise<RaidProtectionSetting | undefined>;
  createRaidProtectionSettings(settings: InsertRaidProtectionSetting): Promise<RaidProtectionSetting>;
  updateRaidProtectionSettings(serverId: string, settingsUpdate: Partial<RaidProtectionSetting>): Promise<RaidProtectionSetting | undefined>;
  
  // Infractions methods
  getInfractions(serverId: string): Promise<Infraction[]>;
  getInfraction(id: number): Promise<Infraction | undefined>;
  getUserInfractions(serverId: string, userId: string): Promise<Infraction[]>;
  createInfraction(infraction: InsertInfraction): Promise<Infraction>;
  updateInfraction(id: number, infractionUpdate: Partial<Infraction>): Promise<Infraction | undefined>;
  deleteInfraction(id: number): Promise<boolean>;
  
  // Verification settings methods
  getVerificationSettings(serverId: string): Promise<VerificationSetting | undefined>;
  createVerificationSettings(settings: InsertVerificationSetting): Promise<VerificationSetting>;
  updateVerificationSettings(serverId: string, settingsUpdate: Partial<VerificationSetting>): Promise<VerificationSetting | undefined>;
  
  // Welcome message settings methods
  getWelcomeMessageSettings(serverId: string): Promise<WelcomeMessageSetting | undefined>;
  createWelcomeMessageSettings(settings: InsertWelcomeMessageSetting): Promise<WelcomeMessageSetting>;
  updateWelcomeMessageSettings(serverId: string, settingsUpdate: Partial<WelcomeMessageSetting>): Promise<WelcomeMessageSetting | undefined>;
  
  // Payment and subscription methods
  getUserSubscription(userId: number): Promise<UserSubscription | undefined>;
  getUserSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: number, data: Partial<UserSubscription>): Promise<UserSubscription | undefined>;
  getPaymentTransactionsByUserId(userId: number): Promise<PaymentTransaction[]>;
  createPaymentTransaction(transaction: InsertPaymentTransaction): Promise<PaymentTransaction>;
  updatePaymentTransactionByTransactionId(transactionId: string, data: Partial<PaymentTransaction>): Promise<PaymentTransaction | undefined>;
  
  // Stripe-related methods
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, data: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User | undefined>;
  
  // Password update method
  updatePassword(id: number, newPassword: string): Promise<boolean>;
}

// Create and export the storage instance
export const storage = new DatabaseStorage();