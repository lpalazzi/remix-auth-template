import bcrypt from 'bcryptjs';
import { db } from '~/db.server';

async function getHashByUserId(userId: number) {
  return (await db.password.findUnique({ where: { userId } }))?.hash;
}

async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function verifyPasswordByUserId(userId: number, password: string) {
  const passwordHash = await getHashByUserId(userId);
  return !!passwordHash && (await verifyPassword(password, passwordHash));
}

export async function generateHash(password: string) {
  return bcrypt.hash(password, 10);
}
