import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { env } from "./env.js";

// Local Strategy — email + password
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }
        if (!user.password) {
          return done(null, false, {
            message: `This account was created with ${user.authProvider}. Please sign in with ${user.authProvider}.`,
          });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy (with Account Linking)
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const rawEmail = profile.emails?.[0]?.value;
        const email = rawEmail ? rawEmail.toLowerCase().trim() : `google_${profile.id}@noemail.local`;

        // 1. Check if user already exists with this googleId
        let user = await User.findOne({ googleId: profile.id });

        // 2. If not found by googleId, link with existing user by email
        if (!user && rawEmail) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (!user.avatarUrl && profile.photos?.[0]?.value) {
              user.avatarUrl = profile.photos[0].value;
            }
            await user.save();
          }
        }

        // 3. If no account exists at all, create a new user
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email,
            username: profile.displayName || `google_${profile.id}`,
            authProvider: "google",
            avatarUrl: profile.photos?.[0]?.value,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// GitHub OAuth Strategy (with Account Linking)
passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: (error: Error | null, user?: Express.User) => void
    ) => {
      try {
        const rawEmail = profile.emails?.[0]?.value;
        const email = rawEmail ? rawEmail.toLowerCase().trim() : `github_${profile.id}@noemail.local`;

        // 1. Check if user already exists with this githubId
        let user = await User.findOne({ githubId: profile.id });

        // 2. If not found by githubId, link with existing user by email (e.g. created with Google)
        if (!user && rawEmail) {
          user = await User.findOne({ email });
          if (user) {
            user.githubId = profile.id;
            if (!user.avatarUrl && profile.photos?.[0]?.value) {
              user.avatarUrl = profile.photos[0].value;
            }
            await user.save();
          }
        }

        // 3. If no account exists at all, create a new user
        if (!user) {
          user = await User.create({
            githubId: profile.id,
            email,
            username:
              profile.username || profile.displayName || `github_${profile.id}`,
            authProvider: "github",
            avatarUrl: profile.photos?.[0]?.value,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// Passport serialize/deserialize
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as any)._id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
