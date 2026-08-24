import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET не задан в переменных окружения");
  }
  return secret;
}

/**
 * Простая подписанная сессия без внешних библиотек:
 * "<adminId>.<expiresAtMs>.<hmacSha256>". Секрет — ADMIN_SESSION_SECRET.
 */
export function createSessionToken(adminId: string): string {
  const expires = Date.now() + ADMIN_COOKIE_MAX_AGE * 1000;
  const payload = `${adminId}.${expires}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [adminId, expiresStr, sig] = parts;

  const payload = `${adminId}.${expiresStr}`;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");

  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  if (Date.now() > Number(expiresStr)) return null;
  return adminId;
}
