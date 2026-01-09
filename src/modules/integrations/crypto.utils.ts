import crypto from 'node:crypto';
import { logger } from '../../common/utils/logger.js';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

// ENCRYPTION_KEY is REQUIRED in production (32 characters)
if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY is required in production');
}

// In development, use a default key with warning
if (!process.env.ENCRYPTION_KEY) {
    logger.warn('ENCRYPTION_KEY not set - using insecure default for development only');
}

const KEY = process.env.ENCRYPTION_KEY || 'dev-only-key-32-characters-here!';

export function encrypt(text: string): string {
    if (!text) return '';

    // Ensure key is 32 bytes (pad or truncate if needed for dev strictly)
    // For production, we should enforce 32 bytes
    const key = Buffer.from(KEY.padEnd(32).slice(0, 32));

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
    if (!text) return '';

    const key = Buffer.from(KEY.padEnd(32).slice(0, 32));

    const [ivHex, encryptedHex] = text.split(':');
    if (!ivHex || !encryptedHex) return text; // Return as is if not in our format

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}
