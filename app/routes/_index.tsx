import { defer, json } from '@remix-run/cloudflare'
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare'
import {
  Await,
  isRouteErrorResponse,
  useFetcher,
  useLoaderData,
  useRouteError,
} from '@remix-run/react'
import {
  addTodo,
  deleteTodo,
  deleteTodoSchema,
  editTodo,
  getTodos,
  insertTodoSchema,
  selectTodoSchema,
} from '~/db.server'
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
    <section className="flex flex-col items-center py-4">
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
      const todo_parsed = insertTodoSchema.parse(todo)
      const { success } = await addTodo(env.DB, todo_parsed.title)
      invariant(success, 'failed to add todo')
      return json({ success })
    }

    case 'edit': {
      const todo_parsed = selectTodoSchema.parse(todo)
      const { success } = await editTodo(
        env.DB,
        todo_parsed.id,
        todo_parsed.title
      )
      invariant(success, 'failed to edit todo')
      return json({ success })
    }

    case 'delete': {
      const todo_parsed = deleteTodoSchema.parse(todo)
      const { success } = await deleteTodo(env.DB, todo_parsed.id)
      invariant(success, 'failed to delete todo')
      return json({ success })
    }

    default: {
      throw new Response('unknown action', { status: 400 })
    }
  }
}

export function ErrorBoundary() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    )
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    )
  } else {
    return <h1>Unknown Error</h1>
  }
}
