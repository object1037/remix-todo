import { drizzle } from 'drizzle-orm/d1'
import { todos } from './schema'
import { eq } from 'drizzle-orm'

// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const getTodos = async (db_binding: D1Database) => {
  const db = drizzle(db_binding)
  const result = await db.select().from(todos).all()
  // await sleep(3000)
  return result
}

export const addTodo = async (db_binding: D1Database, title: string) => {
  const db = drizzle(db_binding)
  return db.insert(todos).values({ title })
}

export const editTodo = async (
  db_binding: D1Database,
  id: number,
  title: string
) => {
  const db = drizzle(db_binding)
  return db.update(todos).set({ title }).where(eq(todos.id, id))
}

export const deleteTodo = async (db_binding: D1Database, id: number) => {
  const db = drizzle(db_binding)
  return db.delete(todos).where(eq(todos.id, id))
}
