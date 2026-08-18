import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface TokenPayload {
  id: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, env.JWT_SECRET as string, {
    expiresIn: (env.JWT_EXPIRES_IN || "7d") as any,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
