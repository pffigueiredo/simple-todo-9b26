
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();

    expect(result).toEqual([]);
  });

  it('should return all todos ordered by created_at desc', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First description',
          completed: false
        },
        {
          title: 'Second Todo',
          description: null,
          completed: true
        },
        {
          title: 'Third Todo',
          description: 'Third description',
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify all todos are present
    const titles = result.map(todo => todo.title);
    expect(titles).toContain('First Todo');
    expect(titles).toContain('Second Todo');
    expect(titles).toContain('Third Todo');

    // Verify proper field types and structure
    result.forEach(todo => {
      expect(todo.id).toBeTypeOf('number');
      expect(todo.title).toBeTypeOf('string');
      expect(todo.completed).toBeTypeOf('boolean');
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
      // description can be string or null
      expect(todo.description === null || typeof todo.description === 'string').toBe(true);
    });

    // Verify ordering by created_at desc (newest first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });

  it('should handle todos with various field values', async () => {
    // Create todos with different field combinations
    await db.insert(todosTable)
      .values([
        {
          title: 'Todo with description',
          description: 'Has description',
          completed: true
        },
        {
          title: 'Todo without description',
          description: null,
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    
    // Find specific todos
    const todoWithDesc = result.find(t => t.title === 'Todo with description');
    const todoWithoutDesc = result.find(t => t.title === 'Todo without description');

    expect(todoWithDesc).toBeDefined();
    expect(todoWithDesc!.description).toEqual('Has description');
    expect(todoWithDesc!.completed).toBe(true);

    expect(todoWithoutDesc).toBeDefined();
    expect(todoWithoutDesc!.description).toBeNull();
    expect(todoWithoutDesc!.completed).toBe(false);
  });
});
