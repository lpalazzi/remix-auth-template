import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { authService } from '~/services';

export const action: ActionFunction = async ({ request }) =>
  authService.logout(request);
export const loader: LoaderFunction = async () => redirect('/');
