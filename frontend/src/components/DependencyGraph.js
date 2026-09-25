"use client";

import { useMemo } from "react";

export default function DependencyGraph({
  tasks,
  dependencyMap,
}) {
  const graph = useMemo(() => {
    const nodes = tasks.map((task, index) => {
      const incoming =
        dependencyMap[task.id]?.incoming || [];

      const outgoing =
        dependencyMap[task.id]?.outgoing || [];

      const isBlocked = incoming.some(
        (dependency) =>
          dependency.predecessor_status &&
          dependency.predecessor_status !== "DONE"
      );

      let state = "READY";

      if (task.status === "DONE") {
        state = "DONE";
      } else if (isBlocked) {
        state = "BLOCKED";
      }

      return {
        ...task,
        incoming,
        outgoing,
        state,
        index,
      };
    });

    const edges = [];

    tasks.forEach((task) => {
      const outgoing =
        dependencyMap[task.id]?.outgoing || [];

      outgoing.forEach((dependency) => {
        edges.push({
          id: dependency.id,
          from: dependency.predecessor_id,
          to: dependency.successor_id,
        });
      });
    });

    return {
      nodes,
      edges,
    };
  }, [tasks, dependencyMap]);

  function getNodeStateClass(state) {
    if (state === "DONE") {
      return "border-blue-500/40 bg-blue-500/10";
    }

    if (state === "BLOCKED") {
      return "border-red-500/40 bg-red-500/10";
    }

    return "border-emerald-500/40 bg-emerald-500/10";
  }

  function getStateBadgeClass(state) {
    if (state === "DONE") {
      return "bg-blue-500/10 text-blue-400";
    }

    if (state === "BLOCKED") {
      return "bg-red-500/10 text-red-400";
    }

    return "bg-emerald-500/10 text-emerald-400";
  }

  return (
    <section className="space-y-6">

      {/* =================================================
          HEADER
          ================================================= */}

      <div>
        <h2 className="text-xl font-semibold text-white">
          Dependency Graph
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Visual representation of task dependencies and
          workflow execution order.
        </p>
      </div>

      {/* =================================================
          LEGEND
          ================================================= */}

      <div className="flex flex-wrap gap-3">

        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

          <span className="text-xs text-emerald-400">
            READY
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />

          <span className="text-xs text-red-400">
            BLOCKED
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />

          <span className="text-xs text-blue-400">
            DONE
          </span>
        </div>

      </div>

      {/* =================================================
          GRAPH
          ================================================= */}

      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-8">

        {graph.nodes.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">

              <div className="text-4xl">
                ◇
              </div>

              <p className="mt-3 text-sm font-medium text-slate-300">
                No tasks available
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Create tasks to build your dependency graph.
              </p>

            </div>
          </div>
        ) : graph.edges.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="text-center">

              <div className="text-4xl">
                ↔
              </div>

              <p className="mt-3 text-sm font-medium text-slate-300">
                No dependencies found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Connect tasks from the Dependencies page
                to generate the DAG.
              </p>

            </div>
          </div>
        ) : (
          <div className="min-w-[800px]">

            {/* =================================================
                GRAPH NODES
                ================================================= */}

            <div className="space-y-5">

              {graph.nodes.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-5"
                >

                  {/* NODE */}

                  <div
                    className={`w-80 rounded-xl border p-5 shadow-lg ${getNodeStateClass(
                      task.state
                    )}`}
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div className="min-w-0">

                        <p className="text-xs text-slate-500">
                          Task #{task.id}
                        </p>

                        <h3 className="mt-1 truncate font-semibold text-white">
                          {task.title}
                        </h3>

                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStateBadgeClass(
                          task.state
                        )}`}
                      >
                        {task.state}
                      </span>

                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">

                      <span>
                        Status: {task.status}
                      </span>

                      <span>
                        {task.outgoing.length} outgoing
                      </span>

                    </div>

                  </div>

                  {/* CONNECTION */}

                  {task.outgoing.length > 0 && (
                    <div className="flex items-center gap-2">

                      <div className="h-px w-16 bg-slate-700" />

                      <span className="text-xl text-blue-400">
                        →
                      </span>

                    </div>
                  )}

                  {/* TARGET TASKS */}

                  {task.outgoing.length > 0 && (
                    <div className="flex flex-col gap-2">

                      {task.outgoing.map(
                        (dependency) => {
                          const targetTask =
                            graph.nodes.find(
                              (node) =>
                                node.id ===
                                dependency.successor_id
                            );

                          return (
                            <div
                              key={dependency.id}
                              className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-3"
                            >
                              <p className="text-xs text-slate-500">
                                Depends on
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-200">
                                {targetTask?.title ||
                                  dependency.successor_title ||
                                  `Task #${dependency.successor_id}`}
                              </p>
                            </div>
                          );
                        }
                      )}

                    </div>
                  )}

                </div>
              ))}

            </div>

          </div>
        )}

      </div>

      {/* =================================================
          GRAPH SUMMARY
          ================================================= */}

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Tasks
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {graph.nodes.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Dependencies
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {graph.edges.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Blocked Tasks
          </p>

          <p className="mt-2 text-2xl font-bold text-red-400">
            {
              graph.nodes.filter(
                (node) => node.state === "BLOCKED"
              ).length
            }
          </p>
        </div>

      </div>

    </section>
  );
}