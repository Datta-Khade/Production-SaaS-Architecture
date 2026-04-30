import React, { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../api';
import type { Task } from '@shared/v2/schema/tasks';

export const TasksPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'todo' });

  const { data, isLoading, error } = useTasks(page, 10);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleEdit = (task: Task) => {
    setIsEditing(task.uuid);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
    });
  };

  const handleCancel = () => {
    setIsEditing(null);
    setFormData({ title: '', description: '', status: 'todo' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateTask.mutate({ id: isEditing, data: formData }, { onSuccess: handleCancel });
    } else {
      createTask.mutate(formData, { onSuccess: handleCancel });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask.mutate(id);
    }
  };

  if (error) {
    return <div className="p-6 text-red-600">Failed to load tasks: {(error as Error).message}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Tasks</h1>
        <p className="text-sm text-neutral-500">Standard CRUD module reference implementation</p>
      </div>

      {/* Task Form */}
      <form onSubmit={handleSubmit} className="card p-4 space-y-4">
        <h2 className="text-lg font-semibold">{isEditing ? 'Edit Task' : 'New Task'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              required
              className="input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input"
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={createTask.isPending || updateTask.isPending}>
            {isEditing ? 'Update Task' : 'Create Task'}
          </button>
          {isEditing && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Task List */}
      <div className="card divide-y">
        {isLoading ? (
          <div className="p-8 text-center text-neutral-500">Loading tasks...</div>
        ) : data?.data.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">No tasks found.</div>
        ) : (
          data?.data.map((task) => (
            <div key={task.uuid} className="p-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-neutral-900">{task.title}</h3>
                {task.description && <p className="text-sm text-neutral-500 mt-1">{task.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    task.status === 'done' ? 'bg-green-100 text-green-700' :
                    task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-neutral-100 text-neutral-700'
                  }`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-neutral-400">
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(task)}
                  className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  aria-label="Edit task"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.uuid)}
                  className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete task"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.pages > 1 && (
        <div className="flex items-center justify-between px-4">
          <p className="text-sm text-neutral-500">
            Showing page {data.meta.page} of {data.meta.pages} ({data.meta.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary px-3 py-1 text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.meta.pages, p + 1))}
              disabled={page === data.meta.pages}
              className="btn-secondary px-3 py-1 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
