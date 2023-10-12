import { db } from '~/db.server';

export async function findByUserId(userId: number) {
  return db.profile.findUnique({
    where: { userId },
  });
}
