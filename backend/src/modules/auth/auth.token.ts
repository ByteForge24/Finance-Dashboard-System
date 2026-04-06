import jwt from 'jsonwebtoken';
import { TokenPayload } from './auth.types.js';

const JWT_SECRET = process.env.JWT_SECRET as string;
const TOKEN_EXPIRY = '7d';

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as TokenPayload;
  } catch {
    return null;
  }
}
