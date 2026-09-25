"use client";

export default function TaskCard({
  task,
  dependencyMap = {},
  onEdit,
  onDelete,
  onDragStart,
}) {
  const dependencyData =
    dependencyMap[task.id] || {};

  const incoming =
    dependencyData.incoming || [];

  const outgoing =
    dependencyData.outgoing || [];

  const isBlocked = incoming.some(
    (dependency) =>
      dependency.predecessor_status &&
      dependency.predecessor_status !== "DONE"
  );

  let dependencyState = "READY";

  if (task.status === "DONE") {
    dependencyState = "DONE";
  } else if (isBlocked) {
    dependencyState = "BLOCKED";
  }

  const stateStyles = {
    READY:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    BLOCKED:
      "bg-red-500/10 text-red-400 border-red-500/20",
    DONE:
      "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  function handleDragStart(event) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(
      "taskId",
      String(task.id)
    );

    onDragStart?.(event, task);
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group cursor-grab rounded-xl border border-slate-800 bg-slate-900 p-4 transition hover:border-slate-700 hover:shadow-lg active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">
            Task #{task.id}
          </p>

          <h3 className="mt-1 break-words font-semibold text-white">
            {task.title}
          </h3>
        </div>

        <span
          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${stateStyles[dependencyState]}`}
        >
          {dependencyState}
        </span>
      </div>

      {task.description && (
        <p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-400">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {task.priority && (
          <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
            Priority: {task.priority}
          </span>
        )}

        {task.due_date && (
          <span className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-400">
            Due: {task.due_date}
          </span>
        )}
      </div>

      {(incoming.length > 0 ||
        outgoing.length > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Incoming
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-200">
              {incoming.length}
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wide text-slate-500">
              Outgoing
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-200">
              {outgoing.length}
            </p>
          </div>
        </div>
      )}

      {isBlocked && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-xs font-medium text-red-400">
            Task is blocked
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Complete the required predecessor task
            before starting this task.
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
        <span className="text-xs text-slate-600">
          Drag to move
        </span>

        <div className="flex gap-2">
          <button
            type="button"
            draggable={false}
            onClick={() => onEdit?.(task)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Edit
          </button>

          <button
            type="button"
            draggable={false}
            onClick={() => onDelete?.(task)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}