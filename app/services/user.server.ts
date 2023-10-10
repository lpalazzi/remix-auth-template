import bcrypt from 'bcryptjs';
import { db } from '~/db.server';
import type { UserSignupForm } from '~/types/auth.server';

export async function existsByEmail(email: string) {
  const exists = await db.user.count({
    where: { email },
  });
  return !!exists;
}

export async function create(userSignup: UserSignupForm) {
  const passwordHash = await bcrypt.hash(userSignup.password, 10);
  const newUser = await db.user.create({
    data: {
      email: userSignup.email,
      password: {
        create: {
          hash: passwordHash,
        },
      },
      profile: {
        create: {
          firstName: userSignup.firstName,
          lastName: userSignup.lastName,
        },
      },
    },
  });
  return newUser;
}
