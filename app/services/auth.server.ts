import { redirect, json, createCookieSessionStorage } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import { db } from '~/db.server';
import { userService } from '~/services';
import type { UserSignupForm } from '~/types/auth.server';

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set in .env file');
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'auth-session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  });
}

async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function getUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') return null;
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, profile: true },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function signup(userSignup: UserSignupForm) {
  if (await userService.existsByEmail(userSignup.email)) {
    return json(
      { error: 'User already exists with that email' },
      { status: 400 }
    );
  }

  const newUser = await userService.create(userSignup);
  if (!newUser) {
    return json(
      {
        error: 'Something went wrong creating your account. Please try again.',
        fields: { email: userSignup.email },
      },
      { status: 400 }
    );
  }

  return createUserSession(newUser.id, '/');
}

export async function login(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    include: { password: true },
  });

  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(password, user.password.hash))
  ) {
    return json(
      {
        error: 'Incorrect login',
      },
      { status: 400 }
    );
  }

  return createUserSession(user.id, '/');
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  });
}
