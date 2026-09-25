"use client";

import TaskCard from "./TaskCard";

const columns = [
  {
    status: "BACKLOG",
    title: "Backlog",
    color: "text-slate-300",
  },
  {
    status: "IN_PROGRESS",
    title: "In Progress",
    color: "text-blue-400",
  },
  {
    status: "REVIEW",
    title: "Review",
    color: "text-yellow-400",
  },
  {
    status: "DONE",
    title: "Done",
    color: "text-emerald-400",
  },
];

export default function KanbanBoard({
  tasks,
  dependencyMap,
  onEdit,
  onDelete,
  onDropTask,
  onDragStart,
}) {
  function handleDrop(event, status) {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData("taskId");

    if (!taskId) {
      return;
    }

    onDropTask(Number(taskId), status);
  }

  return (
    <div className="grid min-w-[1000px] grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnTasks = tasks.filter(
          (task) => task.status === column.status
        );

        return (
          <div
            key={column.status}
            onDragOver={(event) =>
              event.preventDefault()
            }
            onDrop={(event) =>
              handleDrop(event, column.status)
            }
            className="min-h-[500px] rounded-xl border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="mb-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${column.color}`}
                >
                  {column.title}
                </span>

                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  dependencyMap={dependencyMap}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDragStart={onDragStart}
                />
              ))}

              {columnTasks.length === 0 && (
                <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed border-slate-800 text-sm text-slate-600">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}