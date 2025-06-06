
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    const created = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion'
      })
      .returning()
      .execute();

    const todoId = created[0].id;

    // Delete the todo
    const deleteInput: DeleteTodoInput = { id: todoId };
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);

    // Verify the todo was actually deleted from database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent todo', async () => {
    const deleteInput: DeleteTodoInput = { id: 999 };
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should not affect other todos when deleting one', async () => {
    // Create multiple todos
    const created = await db.insert(todosTable)
      .values([
        { title: 'Todo 1', description: 'First todo' },
        { title: 'Todo 2', description: 'Second todo' },
        { title: 'Todo 3', description: 'Third todo' }
      ])
      .returning()
      .execute();

    // Delete the middle todo
    const deleteInput: DeleteTodoInput = { id: created[1].id };
    const result = await deleteTodo(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the targeted todo was deleted
    const remainingTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(remainingTodos).toHaveLength(2);
    expect(remainingTodos.map(t => t.title)).toEqual(['Todo 1', 'Todo 3']);
  });
});
