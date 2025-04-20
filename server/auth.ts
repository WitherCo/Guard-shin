import { Express, NextFunction, Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { db } from "./db";
import { storage } from "./storage";
import { log } from "./vite";
import { InsertUser, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Extend the Express session type to include Discord guilds
declare module 'express-session' {
  interface SessionData {
    discordGuilds?: any[];
  }
}

// Discord OAuth2 - using type declaration here to avoid package installation issues
interface DiscordStrategyOptions {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
  scope: string[];
}

interface DiscordProfile {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  email?: string;
  guilds?: any[];
}

// Type for Discord strategy
interface Strategy {
  new(options: DiscordStrategyOptions, verify: (accessToken: string, refreshToken: string, profile: DiscordProfile, done: Function) => void): any;
}

// Since we had issues installing passport-discord, we'll use this workaround
// When actually installed, you'd use this instead:
// import { Strategy as DiscordStrategy } from 'passport-discord';

// Initialize PostgreSQL session store
const PostgresqlStore = connectPgSimple(session);

export function setupAuth(app: Express) {
  log("Setting up authentication...");
  
  // Configure express-session
  app.use(
    session({
      store: new PostgresqlStore({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "guard-shin-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport to use a local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }

        // For Discord users, they might not have a password
        if (!user.password) {
          return done(null, false, { message: "Please log in with Discord" });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: "Incorrect password." });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Auth endpoints
  app.post(
    "/api/auth/login",
    passport.authenticate("local"),
    (req: Request, res: Response) => {
      // If here, authentication was successful
      // Remove password from user object before sending back
      const user = { ...req.user } as any;
      delete user.password;
      res.json(user);
    }
  );

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, email, password, acceptTerms, acceptPrivacy } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      // Validate terms and privacy acceptance
      if (!acceptTerms || !acceptPrivacy) {
        return res.status(400).json({ 
          message: "You must accept the Terms of Service and Privacy Policy" 
        });
      }

      // Validate domain is witherco.org if required
      if (process.env.REQUIRE_WITHERCO_DOMAIN === "true") {
        if (!email.endsWith("@witherco.org")) {
          return res.status(400).json({
            message: "Registration is only allowed with witherco.org email addresses",
          });
        }
      }

      // Check if username already exists
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check if email is already used (would need to add this function to storage)
      // This is a placeholder - you'd need to implement getUserByEmail in your storage
      // const existingUserByEmail = await storage.getUserByEmail(email);
      // if (existingUserByEmail) {
      //   return res.status(400).json({ message: "Email is already registered" });
      // }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userData: InsertUser = {
        username,
        password: hashedPassword,
        email
      };

      const newUser = await storage.createUser(userData);
      
      // Auto login the newly registered user
      req.login(newUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to login after registration" });
        }
        
        // Remove password from user object before sending back
        const user = { ...newUser } as any;
        delete user.password;
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.get("/api/auth/user", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      // Remove password from user object before sending back
      const user = { ...req.user } as any;
      delete user.password;
      res.json(user);
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Dev login endpoint for testing purposes without OAuth2
  app.post("/api/auth/dev-login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    // This is for development purposes only
    console.log("Dev login attempt:", username);
    
    // Check for admin credentials
    if (username === 'admin' && password === 'admin123') {
      try {
        // Check if admin user exists in DB
        let adminUser = await storage.getUserByUsername('admin');
        
        // If not, create one
        if (!adminUser) {
          const adminUserData: InsertUser = {
            username: 'admin',
            password: await bcrypt.hash('admin123', 10),
            email: 'admin@example.com',
            discordId: 'dev-admin',
            discordUsername: 'Admin',
            discriminator: '0000',
            avatar: null,
            accessToken: 'dev-token',
            refreshToken: 'dev-refresh-token',
            premiumType: 2, // Premium status for testing
            role: 'admin',
          };
          
          adminUser = await storage.createUser(adminUserData);
          console.log("Created admin dev user");
        }
        
        // Log the user in
        req.login(adminUser, (err) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Error logging in" });
          }
          
          return res.json({ 
            message: "Logged in successfully as dev admin",
            user: {
              id: adminUser.id,
              username: adminUser.username,
              discordId: adminUser.discordId,
              role: adminUser.role,
            }
          });
        });
      } catch (error) {
        console.error("Dev login error:", error);
        return res.status(500).json({ message: "Error during dev login" });
      }
    } else if (username === 'owner' && password === 'owner123') {
      try {
        // Check if owner user exists in DB
        let ownerUser = await storage.getUserByUsername('owner');
        
        // If not, create one
        if (!ownerUser) {
          const ownerUserData: InsertUser = {
            username: 'owner',
            password: await bcrypt.hash('owner123', 10),
            email: 'owner@guard-shin.com',
            discordId: 'dev-owner',
            discordUsername: 'Guard-Shin Owner',
            discriminator: '0001',
            avatar: null,
            accessToken: 'owner-token',
            refreshToken: 'owner-refresh-token',
            premiumType: 3, // Special owner tier
            role: 'owner',
          };
          
          ownerUser = await storage.createUser(ownerUserData);
          console.log("Created owner dev user");
        }
        
        // Log the user in
        req.login(ownerUser, (err) => {
          if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ message: "Error logging in" });
          }
          
          return res.json({ 
            message: "Logged in successfully as owner",
            user: {
              id: ownerUser.id,
              username: ownerUser.username,
              discordId: ownerUser.discordId,
              role: ownerUser.role,
            }
          });
        });
      } catch (error) {
        console.error("Owner login error:", error);
        return res.status(500).json({ message: "Error during owner login" });
      }
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  });

  // Discord OAuth routes
  // Discord login route
  app.get("/api/auth/discord", (req: Request, res: Response) => {
    // Set up the Discord auth URL with proper scopes
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: "Discord client ID not configured" });
    }
    
    // The redirect URI must match exactly what's configured in the Discord Developer Portal
    // Get the full URL from the headers - this should work correctly in Replit's environment
    let host = req.get('host') || 'localhost:5000';
    
    // Always use HTTPS for Discord OAuth2 - this is required for production environments
    let protocol = 'https';
    
    // Special handling for Replit environment
    if (process.env.REPL_ID) {
      // If we have the REPLIT_DOMAINS environment variable, use it directly
      if (process.env.REPLIT_DOMAINS) {
        host = process.env.REPLIT_DOMAINS;
        console.log(`Using Replit domain from env: ${host}`);
      } else {
        // Fallback to constructing the domain from owner and ID
        const replitOwner = process.env.REPL_OWNER || 'WitherCoDev';
        const replitId = process.env.REPL_ID || '3636718d-65b6-4da0-a8e0-cd2137d350e2';
        host = `${replitId}.id.repl.co`;
        console.log(`Constructed Replit domain: ${host}`);
      }
    }
    
    // For a verified bot, we need to use a fixed callback URL that's registered with Discord
    // Use witherco.org for production environment or the specific URL from env variable
    const redirectUri = process.env.DISCORD_REDIRECT_URI || 
                       (process.env.NODE_ENV === 'production' ? 
                        `https://witherco.org/api/auth/discord/callback` : 
                        `${protocol}://${host}/api/auth/discord/callback`);
    
    // Log the redirect URI we're using
    log(`Using redirect URI: ${redirectUri}`);
    
    console.log("====== DISCORD OAUTH2 DEBUG INFO ======");
    console.log(`Client ID from env: '${process.env.DISCORD_CLIENT_ID}'`);
    console.log(`Client ID variable: '${clientId}'`);
    console.log(`Redirect URI: ${redirectUri}`);
    console.log(`Has Client Secret: ${process.env.DISCORD_CLIENT_SECRET ? 'Yes' : 'No'}`);
    console.log(`Client Secret length: ${process.env.DISCORD_CLIENT_SECRET ? process.env.DISCORD_CLIENT_SECRET.length : 0}`);
    console.log(`Environment Variables: NODE_ENV=${process.env.NODE_ENV}`);
    console.log("IMPORTANT: Make sure this exact URL is added to your Discord OAuth2 redirect URLs in the Discord Developer Portal:");
    console.log(`${redirectUri}`);
    console.log("======================================");
    
    // For development purpose, simplify the scopes to just get basic user information
    const scopes = [
      'identify',      // Get user info
      'email',         // Get user email
      'guilds',        // Get user's servers
    ];
    
    // Build the Discord OAuth URL
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}`;
    
    console.log(`Auth URL: ${authUrl}`);
    
    // Redirect the user to Discord's authorization page
    res.redirect(authUrl);
  });
  
  // Discord callback route
  app.get("/api/auth/discord/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const error = req.query.error as string;
    
    console.log("====== DISCORD CALLBACK DEBUG INFO ======");
    console.log(`Received Code: ${code ? 'Yes' : 'No'}`);
    console.log(`Received Error: ${error || 'None'}`);
    console.log(`Query params: ${JSON.stringify(req.query)}`);
    console.log("=========================================");
    
    if (error) {
      console.log(`Discord Auth Error: ${error}`);
      return res.redirect(`/auth?error=${encodeURIComponent(error)}`);
    }
    
    if (!code) {
      return res.redirect('/auth?error=Missing authorization code');
    }
    
    try {
      const clientId = process.env.DISCORD_CLIENT_ID;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET;
      
      // The redirect URI must match exactly what's configured in the Discord Developer Portal
      // Get the full URL from the headers - this should work correctly in Replit's environment
      let host = req.get('host') || 'localhost:5000';
      
      // Always use HTTPS for Discord OAuth2 - this is required for production environments
      let protocol = 'https';
      
      // Special handling for Replit environment
      if (process.env.REPL_ID) {
        // If we have the REPLIT_DOMAINS environment variable, use it directly
        if (process.env.REPLIT_DOMAINS) {
          host = process.env.REPLIT_DOMAINS;
          console.log(`Using Replit domain from env (callback): ${host}`);
        } else {
          // Fallback to constructing the domain from owner and ID
          const replitOwner = process.env.REPL_OWNER || 'WitherCoDev';
          const replitId = process.env.REPL_ID || '3636718d-65b6-4da0-a8e0-cd2137d350e2';
          host = `${replitId}.id.repl.co`;
          console.log(`Constructed Replit domain (callback): ${host}`);
        }
      }
      
      // For a verified bot, we need to use a fixed callback URL that's registered with Discord
      // Use witherco.org for production environment or the specific URL from env variable
      const redirectUri = process.env.DISCORD_REDIRECT_URI || 
                         (process.env.NODE_ENV === 'production' ? 
                          `https://witherco.org/api/auth/discord/callback` : 
                          `${protocol}://${host}/api/auth/discord/callback`);
      
      // Log the redirect URI we're using for callback
      log(`Using callback redirect URI: ${redirectUri}`);
      console.log(`Callback URI: ${redirectUri}`);
      
      // Additional debug info for OAuth credentials
      console.log(`Client ID from env: '${process.env.DISCORD_CLIENT_ID}'`);
      console.log(`Client ID variable: '${clientId}'`);
      console.log(`Has Client Secret: ${process.env.DISCORD_CLIENT_SECRET ? 'Yes' : 'No'}`);
      console.log(`Client Secret length: ${process.env.DISCORD_CLIENT_SECRET ? process.env.DISCORD_CLIENT_SECRET.length : 0}`);
      
      if (!clientId || !clientSecret) {
        console.log("Missing Discord credentials");
        return res.redirect('/auth?error=Discord credentials not configured');
      }
      
      // Exchange code for token
      console.log("Exchanging code for token...");
      const tokenParams = {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      };
      
      console.log("Token exchange params:", JSON.stringify(tokenParams, null, 2));
      
      let tokenData;
      
      try {
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(tokenParams),
        });
        
        if (!tokenResponse.ok) {
          let errorData: any = { error: 'Unknown error' };
          try {
            errorData = await tokenResponse.json();
            console.log(`Discord token error: ${JSON.stringify(errorData)}`);
          } catch (e) {
            const text = await tokenResponse.text();
            console.log(`Discord token error (raw): ${text}`);
            errorData = { error: "Could not parse error response", raw: text };
          }
          
          return res.redirect(`/auth?error=Failed to authenticate with Discord: ${encodeURIComponent(errorData.error || 'Unknown error')}`);
        }
      
        console.log("Token exchange successful");
        tokenData = await tokenResponse.json();
      } catch (err) {
        const error = err as Error;
        console.log(`Token exchange request failed: ${error.message}`);
        return res.redirect(`/auth?error=Failed to connect to Discord API: ${encodeURIComponent(error.message)}`);
      }
      const { access_token, refresh_token } = tokenData;
      
      // Get user details from Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        log(`Discord user data error: ${JSON.stringify(errorData)}`);
        return res.redirect('/auth?error=Failed to get user data from Discord');
      }
      
      const userData = await userResponse.json();
      
      // Get user's guilds (servers)
      let guildsData = [];
      try {
        const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
        
        if (guildsResponse.ok) {
          guildsData = await guildsResponse.json();
          console.log(`Retrieved ${guildsData.length} guilds for user ${userData.id}`);
        } else {
          log(`Failed to fetch user guilds: ${guildsResponse.status}`);
        }
      } catch (error) {
        log(`Error fetching guilds: ${error}`);
      }

      // Store guilds data in session for quick access
      req.session.discordGuilds = guildsData;
      
      // Check if user exists in our database
      let user = await storage.getUserByDiscordId(userData.id);
      
      const userAvatar = userData.avatar 
        ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.${userData.avatar.startsWith('a_') ? 'gif' : 'png'}`
        : null;
      
      if (!user) {
        // Create new user
        const newUserData = {
          username: userData.username || `discord-user-${userData.id}`,
          discordId: userData.id,
          avatar: userAvatar,
          discordUsername: userData.username,
          discriminator: userData.discriminator || '0000',
          email: userData.email,
          accessToken: access_token,
          refreshToken: refresh_token,
          premiumType: userData.premium_type || 0,
        };
        
        user = await storage.createDiscordUser(newUserData);
      } else {
        // Update existing user with new tokens and profile data
        await db.update(users)
          .set({ 
            accessToken: access_token, 
            refreshToken: refresh_token,
            avatar: userAvatar,
            discordUsername: userData.username,
            discriminator: userData.discriminator || '0000',
            email: userData.email
          })
          .where(eq(users.discordId, userData.id));
      }
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          log(`Error logging in user: ${err}`);
          return res.redirect('/auth?error=Failed to log in');
        }
        
        // Redirect to dashboard
        res.redirect('/dashboard');
      });
    } catch (err) {
      const error = err as Error;
      log(`Discord callback error: ${error.message}`);
      res.redirect(`/auth?error=Authentication failed: ${encodeURIComponent(error.message)}`);
    }
  });
  
  // Apply authentication middleware to protected routes
  app.use(["/api/servers/:id", "/api/discord/guilds"], isAuthenticated);
}

// Middleware to check if user is authenticated for route protection
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
}