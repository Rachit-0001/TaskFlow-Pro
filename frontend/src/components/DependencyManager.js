"use client";

import { useMemo, useState } from "react";
import EmptyState from "./EmptyState";

import {
  createDependency,
  deleteDependency,
} from "../lib/api";

export default function DependencyManager({
  project,
  tasks,
  dependencyMap,
  onDependencyChanged,
}) {
  const [predecessorId, setPredecessorId] = useState("");
  const [successorId, setSuccessorId] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // FLATTEN DEPENDENCY MAP
  // =====================================================

  const dependencies = useMemo(() => {
    const result = [];
    const seen = new Set();

    tasks.forEach((task) => {
      const data = dependencyMap[task.id];

      if (!data) {
        return;
      }

      const incoming = data.incoming || [];

      incoming.forEach((dependency) => {
        if (seen.has(dependency.id)) {
          return;
        }

        seen.add(dependency.id);

        result.push({
          id: dependency.id,
          predecessorId: dependency.predecessor_id,
          successorId: dependency.successor_id,

          predecessorTitle:
            dependency.predecessor_title ||
            getTaskTitle(
              tasks,
              dependency.predecessor_id
            ),

          successorTitle:
            dependency.successor_title ||
            getTaskTitle(
              tasks,
              dependency.successor_id
            ),
        });
      });
    });

    return result;
  }, [tasks, dependencyMap]);

  // =====================================================
  // CREATE DEPENDENCY
  // =====================================================

  async function handleCreateDependency(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!project) {
      setError("Project is not available.");
      return;
    }

    if (!predecessorId || !successorId) {
      setError(
        "Please select both predecessor and successor tasks."
      );
      return;
    }

    if (predecessorId === successorId) {
      setError(
        "A task cannot depend on itself."
      );
      return;
    }

    try {
      setSaving(true);

      await createDependency({
        projectId: project.id,
        predecessorId: Number(predecessorId),
        successorId: Number(successorId),
      });

      setMessage(
        "Dependency created successfully."
      );

      setPredecessorId("");
      setSuccessorId("");

      if (onDependencyChanged) {
        await onDependencyChanged();
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to create dependency."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================================================
  // DELETE DEPENDENCY
  // =====================================================

  async function handleDeleteDependency(
    dependencyId
  ) {
    const confirmed = window.confirm(
      "Delete this dependency?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(dependencyId);
      setError("");
      setMessage("");

      await deleteDependency(dependencyId);

      setMessage(
        "Dependency deleted successfully."
      );

      if (onDependencyChanged) {
        await onDependencyChanged();
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to delete dependency."
      );
    } finally {
      setDeletingId(null);
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <section className="space-y-6">

      {/* Header */}

      <div>
        <h2 className="text-xl font-semibold text-white">
          Dependency Management
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Connect tasks to control workflow order,
          readiness, and scheduling.
        </p>
      </div>

      {/* =================================================
          CREATE DEPENDENCY
          ================================================= */}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">
            Create Dependency
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            The predecessor must be completed before
            the successor can become ready.
          </p>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon="✓"
            title="No tasks available"
            description="Create tasks before adding dependencies between them."
          />
        ) : (
          <form
            onSubmit={handleCreateDependency}
            className="grid gap-5 md:grid-cols-[1fr_auto_1fr_auto] md:items-end"
          >

            {/* Predecessor */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Predecessor Task
              </label>

              <select
                value={predecessorId}
                onChange={(event) =>
                  setPredecessorId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="">
                  Select predecessor
                </option>

                {tasks.map((task) => (
                  <option
                    key={task.id}
                    value={task.id}
                  >
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Arrow */}

            <div className="hidden items-center justify-center pb-3 md:flex">
              <span className="text-2xl text-blue-400">
                →
              </span>
            </div>

            {/* Successor */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Successor Task
              </label>

              <select
                value={successorId}
                onChange={(event) =>
                  setSuccessorId(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="">
                  Select successor
                </option>

                {tasks.map((task) => (
                  <option
                    key={task.id}
                    value={task.id}
                  >
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Button */}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Adding..."
                : "Add Dependency"}
            </button>

          </form>
        )}

        {/* Success */}

        {message && (
          <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            {message}
          </div>
        )}

        {/* Error */}

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

      </div>

      {/* =================================================
          DEPENDENCY LIST
          ================================================= */}

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">

        <div className="mb-6 flex items-center justify-between">

          <div>
            <h3 className="text-lg font-semibold text-white">
              Current Dependencies
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {dependencies.length} dependency
              {dependencies.length === 1
                ? ""
                : "ies"} configured
            </p>
          </div>

        </div>

        {dependencies.length === 0 ? (
          <EmptyState
            icon="↔"
            title="No dependencies yet"
            description="Create a dependency above to connect two tasks and control their workflow order."
          />
        ) : (
          <div className="space-y-3">

            {dependencies.map((dependency) => (
              <div
                key={dependency.id}
                className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4 md:flex-row md:items-center md:justify-between"
              >

                <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">

                  {/* Predecessor */}

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                      Predecessor
                    </p>

                    <p className="truncate font-medium text-white">
                      {dependency.predecessorTitle}
                    </p>
                  </div>

                  {/* Arrow */}

                  <div className="text-xl text-blue-400">
                    →
                  </div>

                  {/* Successor */}

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">
                      Successor
                    </p>

                    <p className="truncate font-medium text-white">
                      {dependency.successorTitle}
                    </p>
                  </div>

                </div>

                {/* Delete */}

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteDependency(
                      dependency.id
                    )
                  }
                  disabled={
                    deletingId === dependency.id
                  }
                  className="rounded-lg border border-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingId === dependency.id
                    ? "Deleting..."
                    : "Delete"}
                </button>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* =================================================
          DEPENDENCY INFORMATION
          ================================================= */}

      <div className="grid gap-4 md:grid-cols-2">

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">

          <div className="flex items-center gap-3">

            <span className="text-xl">
              🔴
            </span>

            <div>
              <h4 className="font-semibold text-red-400">
                BLOCKED
              </h4>

              <p className="mt-1 text-sm text-slate-400">
                A task is blocked when an incoming
                dependency has not been completed.
              </p>
            </div>

          </div>

        </div>

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">

          <div className="flex items-center gap-3">

            <span className="text-xl">
              🟢
            </span>

            <div>
              <h4 className="font-semibold text-emerald-400">
                READY
              </h4>

              <p className="mt-1 text-sm text-slate-400">
                A task becomes ready when its incoming
                dependencies are completed.
              </p>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
}

// =====================================================
// HELPER
// =====================================================

function getTaskTitle(tasks, taskId) {
  const task = tasks.find(
    (item) => item.id === taskId
  );

  return task?.title || `Task #${taskId}`;
}