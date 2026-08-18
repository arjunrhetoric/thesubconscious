// TypeScript module augmentation for Express.Request
// Eliminates all @ts-ignore usage when accessing req.userId

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
