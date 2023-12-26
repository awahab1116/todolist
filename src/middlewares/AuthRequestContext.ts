import { Request } from "express";

export type AuthRequest = Request & {
  userId?: number;
};

export type FacebookRequest = Request & {
  user?: {
    email?: string;
    displayName?: string;
  };
};
