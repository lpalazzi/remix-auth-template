import { LoaderFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { Layout } from '~/components/layout';
import { authService } from '~/services';
import { UserWithProfile } from '~/types';

type HomeLoaderData = {
  user: UserWithProfile;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await authService.requireLoggedInUser(request);
  return { user } as HomeLoaderData;
};

export default function Home() {
  const { user } = useLoaderData<HomeLoaderData>();
  return (
    <Layout>
      <div className='h-full justify-center items-center flex flex-col gap-y-4'>
        <h1 className='text-5xl font-extrabold text-yellow-300'>Home Page</h1>
        <p className='font-semibold text-slate-300'>
          Welcome, {user.profile?.firstName + ' ' + user.profile?.lastName}!
        </p>
        <form action='logout' method='post'>
          <button
            type='submit'
            className='rounded-xl mt-2 bg-yellow-300 px-3 py-2 text-blue-600 font-semibold transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1'
          >
            Sign out
          </button>
        </form>
      </div>
    </Layout>
  );
}
