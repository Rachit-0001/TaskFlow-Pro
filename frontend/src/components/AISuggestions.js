"use client";

import { useState } from "react";
import EmptyState from "./EmptyState";

import {
  generateAISuggestion,
  acceptAISuggestion,
  rejectAISuggestion,
} from "../lib/api";

export default function AISuggestions({
  suggestions = [],
  tasks = [],
  onSuggestionChanged,
}) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleGenerate() {
    if (!selectedTaskId) {
      setError("Please select a task first.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setMessage("");

      const result = await generateAISuggestion(
        Number(selectedTaskId)
      );

      console.log("AI generation response:", result);

      setMessage("AI suggestion generated successfully.");

      if (onSuggestionChanged) {
        await onSuggestionChanged();
      }
    } catch (err) {
      console.error("AI generation error:", err);

      setError(
        err?.message ||
          "Failed to generate AI suggestion."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleAccept(id) {
    try {
      setProcessingId(id);
      setError("");
      setMessage("");

      await acceptAISuggestion(id);

      setMessage("AI suggestion accepted.");

      if (onSuggestionChanged) {
        await onSuggestionChanged();
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to accept suggestion."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id) {
    try {
      setProcessingId(id);
      setError("");
      setMessage("");

      await rejectAISuggestion(id);

      setMessage("AI suggestion rejected.");

      if (onSuggestionChanged) {
        await onSuggestionChanged();
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "Failed to reject suggestion."
      );
    } finally {
      setProcessingId(null);
    }
  }

  const pendingSuggestions = suggestions.filter(
    (suggestion) =>
      suggestion.status === "PENDING"
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            AI Suggestions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review AI-generated workflow suggestions before applying them.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedTaskId}
            onChange={(event) => {
              setSelectedTaskId(event.target.value);
              setError("");
              setMessage("");
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="">
              Select task
            </option>

            {tasks.map((task) => (
              <option
                key={task.id}
                value={task.id}
              >
                #{task.id} - {task.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={
              generating ||
              !selectedTaskId
            }
            className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating
              ? "Generating..."
              : "✦ Generate Suggestion"}
          </button>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <EmptyState
          icon="✓"
          title="No tasks available"
          description="Create a task first before generating an AI suggestion."
        />
      ) : pendingSuggestions.length === 0 ? (
        <EmptyState
          icon="✦"
          title="No pending suggestions"
          description="Select a task above to generate an AI workflow suggestion."
        />
      ) : (
        <div className="space-y-4">
          {pendingSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-6"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-400">
                      ✦
                    </span>

                    <div>
                      <h3 className="font-semibold text-white">
                        {suggestion.title ||
                          suggestion.type ||
                          "AI Recommendation"}
                      </h3>

                      <p className="mt-1 text-xs uppercase tracking-wide text-yellow-400">
                        AI Suggestion
                      </p>
                    </div>
                  </div>
                </div>

                <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                  PENDING
                </span>
              </div>

              <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-4">
                <p className="text-sm leading-6 text-slate-300">
                  {suggestion.description ||
                    suggestion.reason ||
                    suggestion.message ||
                    "No additional explanation provided."}
                </p>
              </div>

              {(suggestion.task_id ||
                suggestion.predecessor_id ||
                suggestion.successor_id) && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {suggestion.task_id && (
                    <div className="rounded-lg bg-slate-950 p-3">
                      <p className="text-xs text-slate-500">
                        Task
                      </p>

                      <p className="mt-1 text-sm text-slate-200">
                        #{suggestion.task_id}
                      </p>
                    </div>
                  )}

                  {suggestion.predecessor_id && (
                    <div className="rounded-lg bg-slate-950 p-3">
                      <p className="text-xs text-slate-500">
                        Predecessor
                      </p>

                      <p className="mt-1 text-sm text-slate-200">
                        #{suggestion.predecessor_id}
                      </p>
                    </div>
                  )}

                  {suggestion.successor_id && (
                    <div className="rounded-lg bg-slate-950 p-3">
                      <p className="text-xs text-slate-500">
                        Successor
                      </p>

                      <p className="mt-1 text-sm text-slate-200">
                        #{suggestion.successor_id}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleReject(suggestion.id)
                  }
                  disabled={
                    processingId === suggestion.id
                  }
                  className="rounded-lg border border-red-500/20 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId === suggestion.id
                    ? "Processing..."
                    : "Reject"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleAccept(suggestion.id)
                  }
                  disabled={
                    processingId === suggestion.id
                  }
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId === suggestion.id
                    ? "Processing..."
                    : "Accept"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}