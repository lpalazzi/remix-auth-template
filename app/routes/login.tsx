import { useState, useEffect, useRef } from 'react';
import {
  ActionFunction,
  LoaderFunction,
  json,
  redirect,
} from '@remix-run/node';
import { useActionData } from '@remix-run/react';
import { FormField } from '~/components/form-field';
import { Layout } from '~/components/layout';
import {
  validateEmail,
  validateName,
  validatePassword,
} from '~/utils/validation.server';
import { authService } from '~/services';

export const loader: LoaderFunction = async ({ request }) => {
  return (await authService.getUser(request)) ? redirect('/') : null;
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const action = form.get('_action');
  const email = form.get('email');
  const password = form.get('password');
  const firstName = form.get('firstName') || '';
  const lastName = form.get('lastName') || '';

  if (
    typeof action !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string'
  ) {
    return json({ error: `Invalid Form Data`, form: action }, { status: 400 });
  }

  const errors = {
    email: validateEmail(email),
    password: validatePassword(password),
    ...(action === 'signup'
      ? {
          firstName: validateName(firstName),
          lastName: validateName(lastName),
        }
      : {}),
  };

  if (Object.values(errors).some(Boolean)) {
    return json(
      {
        errors,
        fields: { email, password, firstName, lastName },
        form: action,
      },
      { status: 400 }
    );
  }

  switch (action) {
    case 'login': {
      return await authService.login(email, password);
    }
    case 'signup': {
      return await authService.signup({
        email,
        password,
        firstName,
        lastName,
      });
    }
    default: {
      return json({ error: `Invalid Form Data` }, { status: 400 });
    }
  }
};

export default function Login() {
  const actionData: any = useActionData();
  const firstLoad = useRef(true);
  const [formAction, setFormAction] = useState<'login' | 'signup'>(
    actionData?.form || 'login'
  );
  const [formData, setFormData] = useState({
    email: actionData?.fields?.email || '',
    password: actionData?.fields?.password || '',
    firstName: actionData?.fields?.firstName || '',
    lastName: actionData?.fields?.lastName || '',
  });
  const [fieldErrors, setFieldErrors] = useState(actionData?.errors || {});
  const [formError, setFormError] = useState(actionData?.error || '');

  useEffect(() => {
    if (!firstLoad.current) {
      const newState = {
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      };
      setFormData(newState);
      setFieldErrors(newState);
      setFormError('');
    }
  }, [formAction]);

  useEffect(() => {
    if (!firstLoad.current) {
      setFormError('');
    }
  }, [formData]);

  useEffect(() => {
    firstLoad.current = false;
    return () => {
      firstLoad.current = true;
    };
  }, []);

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    setFormData((form) => ({ ...form, [field]: event.target.value }));
  };

  return (
    <Layout>
      <div className='h-full justify-center items-center flex flex-col gap-y-4'>
        <h1 className='text-5xl font-extrabold text-yellow-300'>
          remix-auth-template
        </h1>
        <p className='font-semibold text-slate-300'>
          {formAction === 'login'
            ? 'Sign in to your account'
            : 'Create a new account'}
        </p>

        <form method='post' className='rounded-2xl bg-gray-200 p-6 w-96'>
          <div className='text-xs font-semibold text-center tracking-wide text-red-500 w-full'>
            {formError}
          </div>
          <FormField
            htmlFor='email'
            label='Email'
            value={formData.email}
            onChange={(e) => handleInputChange(e, 'email')}
            error={fieldErrors?.email}
          />

          <FormField
            htmlFor='password'
            type='password'
            label='Password'
            value={formData.password}
            onChange={(e) => handleInputChange(e, 'password')}
            error={fieldErrors?.password}
          />

          {formAction === 'signup' && (
            <>
              <FormField
                htmlFor='firstName'
                label='First Name'
                value={formData.firstName}
                onChange={(e) => handleInputChange(e, 'firstName')}
                error={fieldErrors?.firstName}
              />
              <FormField
                htmlFor='lastName'
                label='Last Name'
                value={formData.lastName}
                onChange={(e) => handleInputChange(e, 'lastName')}
                error={fieldErrors?.lastName}
              />
            </>
          )}

          <div className='w-full text-center'>
            <button
              type='submit'
              name='_action'
              value={formAction}
              className='rounded-xl mt-2 bg-yellow-300 px-3 py-2 text-blue-600 font-semibold transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1'
            >
              {formAction === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>
        <div className='flex flex-row'>
          <p className='font-semibold text-slate-300'>
            {formAction === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}{' '}
            <span
              onClick={() =>
                setFormAction(formAction === 'login' ? 'signup' : 'login')
              }
              className='font-extrabold text-yellow-300 underline cursor-pointer'
            >
              {formAction === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </Layout>
  );
}
