import { drizzle } from 'drizzle-orm/d1'
import { todos } from './schema'

export const getTodos = async (db_binding: D1Database) => {
  const db = drizzle(db_binding)
  const result = await db.select().from(todos).all()
  return result
}

export const addTodos = async (db_binding: D1Database, title: string) => {
  const db = drizzle(db_binding)
  return db.insert(todos).values({ title })
}
