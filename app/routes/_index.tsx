import { json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { addTodos, getTodos } from '~/db'
import invariant from 'tiny-invariant'

interface Env {
  DB: D1Database
}

export const meta: MetaFunction = () => {
  return [{ title: 'ToDo' }, { name: 'description', content: 'Remix todo app' }]
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = context.env as Env
  const results = await getTodos(env.DB)

  return json({ todos: results })
}

export default function Index() {
  const fetcher = useFetcher()
  const { todos } = useLoaderData<typeof loader>()

  return (
    <>
      <fetcher.Form method="post">
        <input type="text" name="title" placeholder="Add ToDo" />
        <button type="submit">Add</button>
      </fetcher.Form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>
    </>
  )
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const env = context.env as Env
  const todo = (await request.formData()).get('title')

  invariant(todo, 'title is required')
  if (typeof todo !== 'string') {
    throw new Error('title must be a string')
  }

  const { success } = await addTodos(env.DB, todo)
  invariant(success, 'failed to add todo')

  return json({ success })
}
