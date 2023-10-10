import { useState, useEffect, useRef } from 'react';
import { ActionFunction, LoaderFunction, redirect } from '@remix-run/node';
import { useActionData } from '@remix-run/react';

import { authService, passwordService, userService } from '~/services';
import { BadRequestError } from '~/utils/errors.server';
import {
  validateEmail,
  validateName,
  validatePassword,
} from '~/utils/validation.server';

import { FormField } from '~/components/form-field';
import { Layout } from '~/components/layout';

type LoginActionData = {
  formType?: 'login' | 'signup';
  fields?: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };
  formError?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  };
};

export const loader: LoaderFunction = async ({ request }) => {
  return (await authService.getLoggedInUser(request)) ? redirect('/') : null;
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const formType = form.get('_formType');
  const email = form.get('email');
  const password = form.get('password');
  const firstName = form.get('firstName') || '';
  const lastName = form.get('lastName') || '';

  if (
    typeof formType !== 'string' ||
    (formType !== 'login' && formType !== 'signup') ||
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    typeof firstName !== 'string' ||
    typeof lastName !== 'string'
  ) {
    return BadRequestError<LoginActionData>({ formError: 'Invalid form data' });
  }

  const fieldErrors = {
    email: validateEmail(email),
    password: validatePassword(password),
    ...(formType === 'signup'
      ? {
          firstName: validateName(firstName),
          lastName: validateName(lastName),
        }
      : {}),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return BadRequestError<LoginActionData>({
      formType,
      fields: { email, password, firstName, lastName },
      fieldErrors,
    });
  }

  switch (formType) {
    case 'login': {
      const user = await userService.findByEmail(email);
      const verified =
        user &&
        (await passwordService.verifyPasswordByUserId(user.id, password));
      if (!verified) {
        return BadRequestError<LoginActionData>({
          formType,
          fields: { email, password },
          formError: 'Incorrect login credentials',
        });
      }
      return authService.createUserSession(user.id, '/');
    }
    case 'signup': {
      if (await userService.existsByEmail(email)) {
        return BadRequestError<LoginActionData>({
          formType,
          fields: { email, password, firstName, lastName },
          formError: 'User already exists with that email',
        });
      }
      const newUser = await userService.create({
        email,
        password,
        firstName,
        lastName,
      });
      if (!newUser) {
        return BadRequestError<LoginActionData>({
          formType,
          fields: { email, password, firstName, lastName },
          formError:
            'Something went wrong creating your account. Please try again.',
        });
      }
      return authService.createUserSession(newUser.id, '/');
    }
    default: {
      return BadRequestError<LoginActionData>({
        formError: `Invalid Form Data`,
      });
    }
  }
};

export default function Login() {
  const actionData = useActionData<LoginActionData>();
  const firstLoad = useRef(true);
  const [formType, setFormType] = useState<'login' | 'signup'>(
    actionData?.formType || 'login'
  );
  const [formData, setFormData] = useState({
    email: actionData?.fields?.email || '',
    password: actionData?.fields?.password || '',
    firstName: actionData?.fields?.firstName || '',
    lastName: actionData?.fields?.lastName || '',
  });
  const [fieldErrors, setFieldErrors] = useState(actionData?.fieldErrors || {});
  const [formError, setFormError] = useState(actionData?.formError || '');

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
  }, [formType]);

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
          {formType === 'login'
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

          {formType === 'signup' && (
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
              name='_formType'
              value={formType}
              className='rounded-xl mt-2 bg-yellow-300 px-3 py-2 text-blue-600 font-semibold transition duration-300 ease-in-out hover:bg-yellow-400 hover:-translate-y-1'
            >
              {formType === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </form>
        <div className='flex flex-row'>
          <p className='font-semibold text-slate-300'>
            {formType === 'login'
              ? "Don't have an account?"
              : 'Already have an account?'}{' '}
            <span
              onClick={() =>
                setFormType(formType === 'login' ? 'signup' : 'login')
              }
              className='font-extrabold text-yellow-300 underline cursor-pointer'
            >
              {formType === 'login' ? 'Sign up' : 'Sign in'}
            </span>
          </p>
        </div>
      </div>
    </Layout>
  );
}
