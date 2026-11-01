import 'dotenv/config';
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32)
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  return secret;
}
