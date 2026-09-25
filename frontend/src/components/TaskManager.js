"use client";

import { useMemo, useState } from "react";
import EmptyState from "./EmptyState";

export default function TaskManager({
  tasks,
  dependencyMap,
  onCreate,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        task.description
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        task.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  function getDependencyState(task) {
    const incoming =
      dependencyMap[task.id]?.incoming || [];

    if (task.status === "DONE") {
      return "DONE";
    }

    const blocked = incoming.some(
      (dependency) =>
        dependency.predecessor_status &&
        dependency.predecessor_status !== "DONE"
    );

    return blocked ? "BLOCKED" : "READY";
  }

  return (
    <section className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Tasks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage and track all project tasks.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + New Task
        </button>

      </div>

      {/* Filters */}

      <div className="flex flex-col gap-3 md:flex-row">

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search tasks..."
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
        >
          <option value="ALL">
            All Statuses
          </option>

          <option value="BACKLOG">
            Backlog
          </option>

          <option value="IN_PROGRESS">
            In Progress
          </option>

          <option value="REVIEW">
            Review
          </option>

          <option value="DONE">
            Done
          </option>
        </select>

      </div>

      {/* Task count */}

      <div className="text-sm text-slate-500">
        Showing {filteredTasks.length} of{" "}
        {tasks.length} tasks
      </div>

      {/* Tasks */}

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon="✓"
          title={
            tasks.length === 0
              ? "No tasks yet"
              : "No tasks found"
          }
          description={
            tasks.length === 0
              ? "Create your first task to start managing your project workflow."
              : "No tasks match your current search or status filter."
          }
          action={
            tasks.length === 0 ? (
              <button
                type="button"
                onClick={onCreate}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                + Create Task
              </button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="border-b border-slate-800 bg-slate-900">

                <tr>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Task
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dependency
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Priority
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Due Date
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-slate-800">

                {filteredTasks.map((task) => {
                  const dependencyState =
                    getDependencyState(task);

                  return (
                    <tr
                      key={task.id}
                      className="bg-slate-950 transition hover:bg-slate-900"
                    >

                      {/* Task */}

                      <td className="px-5 py-4">

                        <div>
                          <p className="font-medium text-white">
                            {task.title}
                          </p>

                          {task.description && (
                            <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                              {task.description}
                            </p>
                          )}
                        </div>

                      </td>

                      {/* Status */}

                      <td className="px-5 py-4">

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                          {task.status}
                        </span>

                      </td>

                      {/* Dependency */}

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            dependencyState === "BLOCKED"
                              ? "bg-red-500/10 text-red-400"
                              : dependencyState === "DONE"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {dependencyState}
                        </span>

                      </td>

                      {/* Priority */}

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {task.priority || "—"}
                      </td>

                      {/* Due date */}

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {task.due_date || "—"}
                      </td>

                      {/* Actions */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              onEdit(task)
                            }
                            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onDelete(task)
                            }
                            className="rounded-lg px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </section>
  );
}   