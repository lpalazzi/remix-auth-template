# remix-auth-template

Starter code for projects that require user authentication (email+password)

## Stack

- Full-stack web development with [Remix](https://remix.run)
- Styling with [TailwindCSS](https://tailwindcss.com/)
- Database with [PostgreSQL](https://www.postgresql.org/) & [Prisma](https://www.prisma.io/)

## Requirements

- Node.js version 18 or higher
- A PostgreSQL database and its connection string, either hosted locally for development or hosted for production

## Running the app

### Before you build and run

1. Copy `.example.env` to a new file named `.env` at the root of the project, and fill in the values as described.

2. Run `yarn install` to install dependencies.

3. Run the required database migrations:
   - In development: `npx prisma migrate dev`
   - In production: `npx prisma migrate deploy`

### Local development

From your terminal:

```sh
yarn dev
```

This starts the app in development mode, rebuilding assets on file changes.

If you make changes to the database schema, you will need to run `npx prisma migrate dev` again before restarting the server.

### Build and run for Production

If changes were made to the database schema, first run:

```sh
npx prisma migrate deploy
```

Next, build your app for production:

```sh
yarn build
```

Then run the app in production mode:

```sh
yarn start
```
