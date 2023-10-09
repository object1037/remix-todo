import { defer, json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import { Await, useFetcher, useLoaderData } from '@remix-run/react'
import { addTodo, deleteTodo, editTodo, getTodos } from '~/db'
import invariant from 'tiny-invariant'
import { Suspense } from 'react'

interface Env {
  DB: D1Database
}

export const meta: MetaFunction = () => {
  return [{ title: 'ToDo' }, { name: 'description', content: 'Remix todo app' }]
}

export const loader = async ({ context }: LoaderFunctionArgs) => {
  const env = context.env as Env
  const results = getTodos(env.DB)

  return defer({ todos: results })
}

export default function Index() {
  const fetcher = useFetcher()
  const { todos } = useLoaderData<typeof loader>()

  return (
    <section className="flex flex-col items-center py-12">
      <fetcher.Form method="post" className="pb-2 mb-2 border-b">
        <input
          type="text"
          name="title"
          placeholder="Add ToDo"
          className="px-4 py-1.5 rounded-md border border-gray-200"
        />
        <button
          type="submit"
          name="_action"
          value="add"
          className="w-12 py-1.5 ml-2 rounded-md border border-gray-200 hover:bg-gray-200"
        >
          Add
        </button>
      </fetcher.Form>
      <Suspense fallback={<p>loading...</p>}>
        <Await resolve={todos}>
          {(todos) => (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li key={todo.id}>
                  <fetcher.Form method="post" className="inline-block">
                    <input type="hidden" name="id" value={todo.id} />
                    <input
                      type="text"
                      name="title"
                      defaultValue={todo.title}
                      className="px-4 py-1.5 rounded-md"
                    />
                    <button type="submit" name="_action" value="edit" />
                  </fetcher.Form>
                  <fetcher.Form method="post" className="inline">
                    <input type="hidden" name="id" value={todo.id} />
                    <button
                      type="submit"
                      name="_action"
                      value="delete"
                      className="w-12 py-1.5 ml-2 rounded-md border border-gray-200 hover:bg-gray-200"
                    >
                      🗑
                    </button>
                  </fetcher.Form>
                </li>
              ))}
            </ul>
          )}
        </Await>
      </Suspense>
    </section>
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
