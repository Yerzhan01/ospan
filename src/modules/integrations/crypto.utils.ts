import crypto from 'node:crypto';
import { getEnvVar } from '../../config/index.js';

const ALGORITHM = 'aes-256-cbc';
// Use a default key for dev if not provided, but warn in logs. 
// In prod, ENCRYPTION_KEY must be 32 chars.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
    if (!text) return '';

    // Ensure key is 32 bytes (pad or truncate if needed for dev strictly)
    // For production, we should enforce 32 bytes
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(text: string): string {
    if (!text) return '';

    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32));

    const [ivHex, encryptedHex] = text.split(':');
    if (!ivHex || !encryptedHex) return text; // Return as is if not in our format

    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}
