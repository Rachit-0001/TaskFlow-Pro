"use client";
import EmptyState from "./EmptyState";

export default function ProjectManager({
  projects,
  tasks,
  currentProject,
  onSelectProject,
  onCreateProject,
}) {
  function getProjectTaskCount(projectId) {
    if (currentProject?.id === projectId) {
      return tasks.length;
    }

    return 0;
  }

  function getCompletedTaskCount(projectId) {
    if (currentProject?.id === projectId) {
      return tasks.filter(
        (task) => task.status === "DONE"
      ).length;
    }

    return 0;
  }

  return (
    <section className="space-y-6">

      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h2 className="text-xl font-semibold text-white">
            Projects
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your workflow projects.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateProject}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          + New Project
        </button>

      </div>

      {/* Projects */}

      {projects.length === 0 ? (
            <EmptyState
                icon="▤"
                title="No projects yet"
                description="Create your first project to start organizing your workflow."
                action={
                <button
                    type="button"
                    onClick={onCreateProject}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                    + New Project
                </button>
                }
            />
            )  : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {projects.map((item) => {
            const isCurrent =
              Number(item.id) ===
              Number(currentProject?.id);

            const taskCount =
              getProjectTaskCount(item.id);

            const completedCount =
              getCompletedTaskCount(item.id);

            return (
              <div
                key={item.id}
                className={`rounded-xl border p-5 transition ${
                  isCurrent
                    ? "border-blue-500/40 bg-blue-500/5"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700"
                }`}
              >

                {/* Project header */}

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="text-xs text-slate-500">
                      Project #{item.id}
                    </p>

                    <h3 className="mt-1 truncate text-lg font-semibold text-white">
                      {item.name}
                    </h3>

                  </div>

                  {isCurrent && (
                    <span className="shrink-0 rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-400">
                      ACTIVE
                    </span>
                  )}

                </div>

                {/* Description */}

                <p className="mt-4 min-h-[48px] text-sm leading-6 text-slate-400">
                  {item.description ||
                    "No project description available."}
                </p>

                {/* Stats */}

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">

                    <p className="text-xs text-slate-500">
                      Tasks
                    </p>

                    <p className="mt-1 text-lg font-semibold text-white">
                      {taskCount}
                    </p>

                  </div>

                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">

                    <p className="text-xs text-slate-500">
                      Completed
                    </p>

                    <p className="mt-1 text-lg font-semibold text-emerald-400">
                      {completedCount}
                    </p>

                  </div>

                </div>

                {/* Action */}

                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() =>
                    onSelectProject(item.id)
                  }
                  className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    isCurrent
                      ? "cursor-default bg-slate-800 text-slate-500"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                  }`}
                >
                  {isCurrent
                    ? "Current Project"
                    : "Open Project"}
                </button>

              </div>
            );
          })}

        </div>
      )}

    </section>
  );
}