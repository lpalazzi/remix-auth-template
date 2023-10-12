import { redirect, createCookieSessionStorage } from '@remix-run/node';
import { db } from '~/db.server';
import { UserWithProfile } from '~/types';

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

async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function createUserSession(userId: number, redirectTo: string) {
  const session = await storage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  });
}

export async function getLoggedInUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'number') return null;
  return userId;
}

export async function requireLoggedInUser(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getLoggedInUserId(request);
  const user =
    !!userId &&
    (await db.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }));
  if (!userId || !user) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return user as UserWithProfile;
}

export async function getLoggedInUser(request: Request) {
  const userId = await getLoggedInUserId(request);
  if (!userId) {
    return null;
  }
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  return user as UserWithProfile;
}

export async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  });
}
