"use client";

export default function ErrorState({
  title = "Something went wrong",
  message = "Unable to load this section.",
  onRetry,
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">

      <div>

        <div className="text-4xl">
          !
        </div>

        <h3 className="mt-4 text-lg font-semibold text-red-400">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Try Again
          </button>
        )}

      </div>

    </div>
  );
}