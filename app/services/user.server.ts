import { db } from '~/db.server';
import { passwordService } from '.';

export async function existsByEmail(email: string) {
  const exists = await db.user.count({
    where: { email },
  });
  return !!exists;
}

export async function findByEmail(email: string) {
  return db.user.findUnique({
    where: { email },
  });
}

export async function create(userSignup: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const passwordHash = await passwordService.generateHash(userSignup.password);
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
