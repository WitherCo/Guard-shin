import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Available styles and themes for welcome images
export const WELCOME_STYLES = {
  DEFAULT: 'default',
  MINIMAL: 'minimal',
  DARK: 'dark',
  COLORFUL: 'colorful',
  GAMING: 'gaming',
  FUTURISTIC: 'futuristic',
};

export const COLOR_THEMES = {
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  RED: 'red',
  GOLD: 'gold',
  MONOCHROME: 'monochrome',
};

// Users table - includes Discord authentication data
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // Can be null for Discord auth users
  discordId: text("discord_id").unique(),
  avatar: text("avatar"),
  discordUsername: text("discord_username"),
  discriminator: text("discriminator"),
  email: text("email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  premiumType: integer("premium_type").default(0),
  role: text("role").default("user"), // Options: user, admin, owner
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  premiumStatus: text("premium_status").default("none"), // Options: none, regular, plus, lifetime, lifetime_plus
  premiumExpiresAt: timestamp("premium_expires_at"),
});

export const insertUserSchema = createInsertSchema(users);

// Schema for local auth
export const localUserSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

// Schema for Discord auth
export const discordUserSchema = insertUserSchema.pick({
  username: true,
  discordId: true,
  avatar: true, 
  discordUsername: true,
  discriminator: true,
  email: true,
  accessToken: true,
  refreshToken: true,
  premiumType: true,
});

// Discord Servers
export const servers = pgTable("servers", {
  id: text("id").primaryKey(), // Discord server ID
  name: text("name").notNull(),
  icon: text("icon"),
  memberCount: integer("member_count").default(0),
  ownerId: text("owner_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  premium: boolean("premium").default(false),
  premiumTier: text("premium_tier").default('free'),
  premiumExpiresAt: timestamp("premium_expires_at"),
  lastTransactionId: text("last_transaction_id"),
});

export const insertServerSchema = createInsertSchema(servers).omit({ 
  joinedAt: true,
  premiumExpiresAt: true,
  premium: true,
  premiumTier: true,
  lastTransactionId: true
});

// Auto-moderation settings
export const autoModSettings = pgTable("auto_mod_settings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  profanityFilterEnabled: boolean("profanity_filter_enabled").default(true),
  spamDetectionEnabled: boolean("spam_detection_enabled").default(true),
  linkFilterEnabled: boolean("link_filter_enabled").default(true),
  duplicateMessagesEnabled: boolean("duplicate_messages_enabled").default(false),
  mediaScanningEnabled: boolean("media_scanning_enabled").default(false),
  profanityWords: text("profanity_words").array(),
  spamThreshold: integer("spam_threshold").default(5),
  spamTimeWindow: integer("spam_time_window").default(5), // in seconds
  allowedLinks: text("allowed_links").array(),
  logChannelId: text("log_channel_id"),
});

export const insertAutoModSettingsSchema = createInsertSchema(autoModSettings).omit({
  id: true
});

// Raid protection settings
export const raidProtectionSettings = pgTable("raid_protection_settings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  enabled: boolean("enabled").default(true),
  joinRateThreshold: integer("join_rate_threshold").default(20),
  joinRateTimeWindow: integer("join_rate_time_window").default(60), // in seconds
  autoLockdown: boolean("auto_lockdown").default(false),
  verificationLevel: text("verification_level").default("LOW"),
  alertChannelId: text("alert_channel_id"),
  lockdownActive: boolean("lockdown_active").default(false),
  lockdownActivatedAt: timestamp("lockdown_activated_at"),
});

export const insertRaidProtectionSettingsSchema = createInsertSchema(raidProtectionSettings).omit({
  id: true,
  lockdownActivatedAt: true
});

// Infractions (warnings, mutes, kicks, bans)
export const infractions = pgTable("infractions", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  moderatorId: text("moderator_id").notNull(),
  moderatorName: text("moderator_name").notNull(),
  type: text("type").notNull(), // warning, mute, kick, ban, timeout
  reason: text("reason"),
  duration: integer("duration"), // in seconds, for temporary actions
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadata: json("metadata"),
});

export const insertInfractionSchema = createInsertSchema(infractions).omit({
  id: true,
  createdAt: true
});

// Verification settings
export const verificationSettings = pgTable("verification_settings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  enabled: boolean("enabled").default(false),
  verificationChannelId: text("verification_channel_id"),
  verifiedRoleId: text("verified_role_id"),
  captchaRequired: boolean("captcha_required").default(true),
  minimumAccountAge: integer("minimum_account_age").default(0), // in days
  logChannelId: text("log_channel_id"),
});

export const insertVerificationSettingsSchema = createInsertSchema(verificationSettings).omit({
  id: true
});

// Welcome Message settings
export const welcomeMessageSettings = pgTable("welcome_message_settings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  enabled: boolean("enabled").default(false),
  welcomeChannelId: text("welcome_channel_id"),
  welcomeMessage: text("welcome_message"),
  embedEnabled: boolean("embed_enabled").default(false),
  embedColor: text("embed_color").default("#5865F2"),
  embedTitle: text("embed_title"),
  embedDescription: text("embed_description"),
  embedThumbnail: boolean("embed_thumbnail").default(false),
  embedImage: text("embed_image"),
  embedFooter: text("embed_footer"),
  dmWelcomeEnabled: boolean("dm_welcome_enabled").default(false),
  dmWelcomeMessage: text("dm_welcome_message"),
  autoRoleEnabled: boolean("auto_role_enabled").default(false),
  autoRoleIds: text("auto_role_ids").array(),
});

export const insertWelcomeMessageSettingsSchema = createInsertSchema(welcomeMessageSettings).omit({
  id: true
});

// Welcome Image settings
export const welcomeImageSettings = pgTable("welcome_image_settings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  enabled: boolean("enabled").default(false),
  style: text("style").default(WELCOME_STYLES.DEFAULT),
  colorTheme: text("color_theme").default(COLOR_THEMES.BLUE),
  customBackground: text("custom_background"),
  customMessage: text("custom_message").default('Welcome to the server, {username}!'),
  showAvatar: boolean("show_avatar").default(true),
  showMemberCount: boolean("show_member_count").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertWelcomeImageSettingsSchema = createInsertSchema(welcomeImageSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Server = typeof servers.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;

export type AutoModSetting = typeof autoModSettings.$inferSelect;
export type InsertAutoModSetting = z.infer<typeof insertAutoModSettingsSchema>;

export type RaidProtectionSetting = typeof raidProtectionSettings.$inferSelect;
export type InsertRaidProtectionSetting = z.infer<typeof insertRaidProtectionSettingsSchema>;

export type Infraction = typeof infractions.$inferSelect;
export type InsertInfraction = z.infer<typeof insertInfractionSchema>;

export type VerificationSetting = typeof verificationSettings.$inferSelect;
export type InsertVerificationSetting = z.infer<typeof insertVerificationSettingsSchema>;

export type WelcomeMessageSetting = typeof welcomeMessageSettings.$inferSelect;
export type InsertWelcomeMessageSetting = z.infer<typeof insertWelcomeMessageSettingsSchema>;

export type WelcomeImageSetting = typeof welcomeImageSettings.$inferSelect;
export type InsertWelcomeImageSetting = z.infer<typeof insertWelcomeImageSettingsSchema>;

// Reaction roles for self-assign
export const reactionRoles = pgTable("reaction_roles", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  messageId: text("message_id").notNull(),
  channelId: text("channel_id").notNull(),
  emoji: text("emoji").notNull(),
  roleId: text("role_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: text("created_by").notNull(),
  active: boolean("active").default(true),
});

export const insertReactionRoleSchema = createInsertSchema(reactionRoles).omit({
  id: true,
  createdAt: true
});

export type ReactionRole = typeof reactionRoles.$inferSelect;
export type InsertReactionRole = z.infer<typeof insertReactionRoleSchema>;

// Auto role settings
export const autoRoleSettings = pgTable("auto_role_settings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  enabled: boolean("enabled").default(false),
  roleIds: text("role_ids").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAutoRoleSettingsSchema = createInsertSchema(autoRoleSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type AutoRoleSetting = typeof autoRoleSettings.$inferSelect;
export type InsertAutoRoleSetting = z.infer<typeof insertAutoRoleSettingsSchema>;

// Server logging settings
export const loggingSettings = pgTable("logging_settings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull().references(() => servers.id),
  moderationLogsEnabled: boolean("moderation_logs_enabled").default(false),
  moderationLogsChannelId: text("moderation_logs_channel_id"),
  messageLogsEnabled: boolean("message_logs_enabled").default(false),
  messageLogsChannelId: text("message_logs_channel_id"),
  memberLogsEnabled: boolean("member_logs_enabled").default(false),
  memberLogsChannelId: text("member_logs_channel_id"),
  serverLogsEnabled: boolean("server_logs_enabled").default(false),
  serverLogsChannelId: text("server_logs_channel_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLoggingSettingsSchema = createInsertSchema(loggingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type LoggingSetting = typeof loggingSettings.$inferSelect;
export type InsertLoggingSetting = z.infer<typeof insertLoggingSettingsSchema>;
