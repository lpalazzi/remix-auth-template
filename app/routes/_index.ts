import { redirect, type LoaderFunction } from '@remix-run/node';
import { authService } from '~/services';

export const loader: LoaderFunction = async ({ request }) => {
  await authService.requireLoggedInUser(request);
  return redirect('/home');
};
