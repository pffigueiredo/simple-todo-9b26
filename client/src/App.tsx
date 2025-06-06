
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Load todos on component mount
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle todo completion
  const toggleComplete = async (todo: Todo) => {
    try {
      const updateData: UpdateTodoInput = {
        id: todo.id,
        completed: !todo.completed
      };
      const updatedTodo = await trpc.updateTodo.mutate(updateData);
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => (t.id === todo.id ? updatedTodo : t))
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  // Delete todo
  const deleteTodo = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✅ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="mt-4 flex justify-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {completedCount} of {totalCount} completed
              </Badge>
            </div>
          )}
        </div>

        {/* Add Todo Form */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="What needs to be done?"
                value={formData.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateTodoInput) => ({ ...prev, title: e.target.value }))
                }
                required
                className="text-lg"
              />
              <Textarea
                placeholder="Add a description (optional)"
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateTodoInput) => ({
                    ...prev,
                    description: e.target.value || null
                  }))
                }
                rows={3}
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.title.trim()}
                className="w-full text-lg py-6"
              >
                {isSubmitting ? 'Adding...' : '✨ Add Task'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todo List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">Loading your tasks...</div>
            </CardContent>
          </Card>
        ) : todos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500 text-lg mb-2">🎉 No tasks yet!</div>
              <p className="text-gray-400">Add your first task above to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todos.map((todo: Todo) => (
              <Card 
                key={todo.id} 
                className={`transition-all duration-300 shadow-md hover:shadow-lg ${
                  todo.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleComplete(todo)}
                      className="mt-1 transition-colors hover:scale-110"
                    >
                      {todo.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 
                        className={`text-lg font-medium ${
                          todo.completed 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p 
                          className={`mt-1 text-sm ${
                            todo.completed 
                              ? 'line-through text-gray-400' 
                              : 'text-gray-600'
                          }`}
                        >
                          {todo.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span>Created: {todo.created_at.toLocaleDateString()}</span>
                        {todo.completed && (
                          <Badge variant="outline" className="text-xs">
                            Completed
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        {todos.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              {completedCount === totalCount 
                ? "🎉 All tasks completed! Great job!" 
                : `${totalCount - completedCount} task${totalCount - completedCount === 1 ? '' : 's'} remaining`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
