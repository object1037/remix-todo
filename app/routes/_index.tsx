import { json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { addTodo, deleteTodo, editTodo, getTodos } from '~/db'
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
        <button type="submit" name="_action" value="add">
          Add
        </button>
      </fetcher.Form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <fetcher.Form method="post" className="inline">
              <input type="hidden" name="id" value={todo.id} />
              <input type="text" name="title" defaultValue={todo.title} />
              <button type="submit" name="_action" value="edit" />
            </fetcher.Form>{' '}
            <fetcher.Form method="post" className="inline">
              <input type="hidden" name="id" value={todo.id} />
              <button type="submit" name="_action" value="delete">
                🗑
              </button>
            </fetcher.Form>
          </li>
        ))}
      </ul>
    </>
  )
}

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const env = context.env as Env
  const todo = Object.fromEntries(await request.formData())

  switch (todo._action) {
    case 'add': {
      invariant(todo.title, 'missing title')
      invariant(typeof todo.title === 'string', 'title must be a string')
      const { success } = await addTodo(env.DB, todo.title)
      invariant(success, 'failed to add todo')
      return json({ success })
    }

    case 'edit': {
      invariant(todo.title, 'missing title')
      invariant(todo.id, 'missing id')
      invariant(typeof todo.title === 'string', 'title must be a string')
      invariant(!isNaN(Number(todo.id)), 'id must be a number')
      const { success } = await editTodo(env.DB, Number(todo.id), todo.title)
      invariant(success, 'failed to edit todo')
      return json({ success })
    }

    case 'delete': {
      invariant(todo.id, 'missing id')
      invariant(!isNaN(Number(todo.id)), 'id must be a number')
      const { success } = await deleteTodo(env.DB, Number(todo.id))
      invariant(success, 'failed to delete todo')
      return json({ success })
    }

    default: {
      return json({ success: false }, { status: 400 })
    }
  }
}
