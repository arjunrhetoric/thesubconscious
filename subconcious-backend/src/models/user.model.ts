import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  githubId?: string;
  authProvider: "local" | "google" | "github";
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional for OAuth users
    googleId: { type: String, sparse: true, unique: true },
    githubId: { type: String, sparse: true, unique: true },
    authProvider: {
      type: String,
      enum: ["local", "google", "github"],
      required: true,
    },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

// Compound unique index: email + authProvider to allow same email across providers
// But since providers are separate, the unique on email alone is fine per spec
// (each signup via different method creates a distinct user doc)

export const User = mongoose.model<IUser>("User", userSchema);
