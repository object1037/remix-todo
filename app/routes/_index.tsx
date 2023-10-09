import {
  json,
  type LoaderFunctionArgs,
  type MetaFunction,
} from '@remix-run/cloudflare'
import { useFetcher, useLoaderData } from '@remix-run/react'

interface Env {
  DB: D1Database
}

type ToDo = {
  ID: number
  Title: string
}

export const meta: MetaFunction = () => {
  return [{ title: 'ToDo' }, { name: 'description', content: 'Remix todo app' }]
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = context.env as Env
  const { results } = await env.DB.prepare('SELECT * FROM ToDos').all<ToDo>()

  return json({ todos: results ?? [] })
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
          <li key={todo.ID}>{todo.Title}</li>
        ))}
      </ul>
    </>
  )
}
