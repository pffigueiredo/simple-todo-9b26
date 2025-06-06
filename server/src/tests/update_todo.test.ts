
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput, type UpdateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a todo for testing
  const createTestTodo = async (input: CreateTodoInput) => {
    const result = await db.insert(todosTable)
      .values({
        title: input.title,
        description: input.description || null,
        completed: false
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update all fields of a todo', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo({
      title: 'Original Todo',
      description: 'Original description'
    });
    
    // Update with new values
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Updated Todo',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(createdTodo.id);
    expect(result.title).toEqual('Updated Todo');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(createdTodo.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update only title when only title is provided', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo({
      title: 'Original Todo',
      description: 'Original description'
    });
    
    // Update only title
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'New Title Only'
    };

    const result = await updateTodo(updateInput);

    // Verify only title and updated_at changed
    expect(result.title).toEqual('New Title Only');
    expect(result.description).toEqual(createdTodo.description);
    expect(result.completed).toEqual(createdTodo.completed);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should update only completed status', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo({
      title: 'Original Todo',
      description: 'Original description'
    });
    
    // Update only completed status
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Verify only completed and updated_at changed
    expect(result.title).toEqual(createdTodo.title);
    expect(result.description).toEqual(createdTodo.description);
    expect(result.completed).toEqual(true);
    expect(result.updated_at > createdTodo.updated_at).toBe(true);
  });

  it('should set description to null', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo({
      title: 'Original Todo',
      description: 'Original description'
    });
    
    // Update description to null
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    // Verify description was set to null
    expect(result.description).toBeNull();
    expect(result.title).toEqual(createdTodo.title);
    expect(result.completed).toEqual(createdTodo.completed);
  });

  it('should save updated todo to database', async () => {
    // Create a todo first
    const createdTodo = await createTestTodo({
      title: 'Original Todo',
      description: 'Original description'
    });
    
    const updateInput: UpdateTodoInput = {
      id: createdTodo.id,
      title: 'Database Update Test',
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Query database directly to verify update
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Update Test');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999, // Non-existent ID
      title: 'Non-existent Todo'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });
});
