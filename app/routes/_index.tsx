import type { LoaderFunction, MetaFunction } from '@remix-run/node';
import { authService } from '~/services';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  await authService.requireUserId(request);
  return null;
};

export default function Index() {
  return (
    <div className='h-screen bg-slate-700 flex justify-center items-center'>
      <h2 className='text-blue-600 font-extrabold text-5xl'>
        TailwindCSS Is Working!
      </h2>
    </div>
  );
}
