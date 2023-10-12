import { User, Profile } from '@prisma/client';

export type UserWithProfile = User & { profile: Profile | null };
