import {
  users, type User, type InsertUser,
  servers, type Server, type InsertServer,
  autoModSettings, type AutoModSetting, type InsertAutoModSetting,
  raidProtectionSettings, type RaidProtectionSetting, type InsertRaidProtectionSetting,
  infractions, type Infraction, type InsertInfraction,
  verificationSettings, type VerificationSetting, type InsertVerificationSetting,
  welcomeMessageSettings, type WelcomeMessageSetting, type InsertWelcomeMessageSetting
} from "@shared/schema";
import { DatabaseStorage } from "./database-storage";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createDiscordUser(user: any): Promise<User>;
  updateUserTokens(discordId: string, accessToken: string, refreshToken: string): Promise<boolean>;
  
  // Server methods
  getServer(id: string): Promise<Server | undefined>;
  getServers(): Promise<Server[]>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: string, server: Partial<Server>): Promise<Server | undefined>;
  deleteServer(id: string): Promise<boolean>;
  
  // Auto-moderation settings
  getAutoModSettings(serverId: string): Promise<AutoModSetting | undefined>;
  createAutoModSettings(settings: InsertAutoModSetting): Promise<AutoModSetting>;
  updateAutoModSettings(serverId: string, settings: Partial<AutoModSetting>): Promise<AutoModSetting | undefined>;
  
  // Raid protection settings
  getRaidProtectionSettings(serverId: string): Promise<RaidProtectionSetting | undefined>;
  createRaidProtectionSettings(settings: InsertRaidProtectionSetting): Promise<RaidProtectionSetting>;
  updateRaidProtectionSettings(serverId: string, settings: Partial<RaidProtectionSetting>): Promise<RaidProtectionSetting | undefined>;
  
  // Infractions
  getInfractions(serverId: string): Promise<Infraction[]>;
  getInfraction(id: number): Promise<Infraction | undefined>;
  getUserInfractions(serverId: string, userId: string): Promise<Infraction[]>;
  createInfraction(infraction: InsertInfraction): Promise<Infraction>;
  updateInfraction(id: number, infraction: Partial<Infraction>): Promise<Infraction | undefined>;
  deleteInfraction(id: number): Promise<boolean>;
  
  // Verification settings
  getVerificationSettings(serverId: string): Promise<VerificationSetting | undefined>;
  createVerificationSettings(settings: InsertVerificationSetting): Promise<VerificationSetting>;
  updateVerificationSettings(serverId: string, settings: Partial<VerificationSetting>): Promise<VerificationSetting | undefined>;
  
  // Welcome message settings
  getWelcomeMessageSettings(serverId: string): Promise<WelcomeMessageSetting | undefined>;
  createWelcomeMessageSettings(settings: InsertWelcomeMessageSetting): Promise<WelcomeMessageSetting>;
  updateWelcomeMessageSettings(serverId: string, settings: Partial<WelcomeMessageSetting>): Promise<WelcomeMessageSetting | undefined>;
}

// Using in-memory storage for now, will replace with database storage later
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private servers: Map<string, Server>;
  private autoModSettings: Map<string, AutoModSetting>;
  private raidProtectionSettings: Map<string, RaidProtectionSetting>;
  private infractions: Map<number, Infraction>;
  private verificationSettings: Map<string, VerificationSetting>;
  private welcomeMessageSettings: Map<string, WelcomeMessageSetting>;
  
  private userIdCounter: number;
  private infractionIdCounter: number;
  private autoModIdCounter: number;
  private raidProtectionIdCounter: number;
  private verificationIdCounter: number;
  private welcomeMessageIdCounter: number;

  constructor() {
    this.users = new Map();
    this.servers = new Map();
    this.autoModSettings = new Map();
    this.raidProtectionSettings = new Map();
    this.infractions = new Map();
    this.verificationSettings = new Map();
    this.welcomeMessageSettings = new Map();
    
    this.userIdCounter = 1;
    this.infractionIdCounter = 1;
    this.autoModIdCounter = 1;
    this.raidProtectionIdCounter = 1;
    this.verificationIdCounter = 1;
    this.welcomeMessageIdCounter = 1;
  }

  // We're not using the MemStorage implementation, so the methods are left as stubs
  async getUser(id: number): Promise<User | undefined> { return undefined; }
  async getUserByUsername(username: string): Promise<User | undefined> { return undefined; }
  async getUserByDiscordId(discordId: string): Promise<User | undefined> { return undefined; }
  async createUser(insertUser: InsertUser): Promise<User> { throw new Error("Not implemented"); }
  async createDiscordUser(user: any): Promise<User> { throw new Error("Not implemented"); }
  async updateUserTokens(discordId: string, accessToken: string, refreshToken: string): Promise<boolean> { return false; }
  async getServer(id: string): Promise<Server | undefined> { return undefined; }
  async getServers(): Promise<Server[]> { return []; }
  async createServer(server: InsertServer): Promise<Server> { throw new Error("Not implemented"); }
  async updateServer(id: string, serverUpdate: Partial<Server>): Promise<Server | undefined> { return undefined; }
  async deleteServer(id: string): Promise<boolean> { return false; }
  async getAutoModSettings(serverId: string): Promise<AutoModSetting | undefined> { return undefined; }
  async createAutoModSettings(settings: InsertAutoModSetting): Promise<AutoModSetting> { throw new Error("Not implemented"); }
  async updateAutoModSettings(serverId: string, settingsUpdate: Partial<AutoModSetting>): Promise<AutoModSetting | undefined> { return undefined; }
  async getRaidProtectionSettings(serverId: string): Promise<RaidProtectionSetting | undefined> { return undefined; }
  async createRaidProtectionSettings(settings: InsertRaidProtectionSetting): Promise<RaidProtectionSetting> { throw new Error("Not implemented"); }
  async updateRaidProtectionSettings(serverId: string, settingsUpdate: Partial<RaidProtectionSetting>): Promise<RaidProtectionSetting | undefined> { return undefined; }
  async getInfractions(serverId: string): Promise<Infraction[]> { return []; }
  async getInfraction(id: number): Promise<Infraction | undefined> { return undefined; }
  async getUserInfractions(serverId: string, userId: string): Promise<Infraction[]> { return []; }
  async createInfraction(infraction: InsertInfraction): Promise<Infraction> { throw new Error("Not implemented"); }
  async updateInfraction(id: number, infractionUpdate: Partial<Infraction>): Promise<Infraction | undefined> { return undefined; }
  async deleteInfraction(id: number): Promise<boolean> { return false; }
  async getVerificationSettings(serverId: string): Promise<VerificationSetting | undefined> { return undefined; }
  async createVerificationSettings(settings: InsertVerificationSetting): Promise<VerificationSetting> { throw new Error("Not implemented"); }
  async updateVerificationSettings(serverId: string, settingsUpdate: Partial<VerificationSetting>): Promise<VerificationSetting | undefined> { return undefined; }
  async getWelcomeMessageSettings(serverId: string): Promise<WelcomeMessageSetting | undefined> { return undefined; }
  async createWelcomeMessageSettings(settings: InsertWelcomeMessageSetting): Promise<WelcomeMessageSetting> { throw new Error("Not implemented"); }
  async updateWelcomeMessageSettings(serverId: string, settingsUpdate: Partial<WelcomeMessageSetting>): Promise<WelcomeMessageSetting | undefined> { return undefined; }
}

export const storage = new DatabaseStorage();

// Initialize sample data
(async () => {
  try {
    await storage.initializeDemoData();
  } catch (error) {
    console.error("Failed to initialize sample data:", error);
  }
})();