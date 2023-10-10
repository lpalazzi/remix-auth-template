import { json } from '@remix-run/node';

export function BadRequestError<Data>(data: Data) {
  return json<Data>(data, { status: 400 });
}
