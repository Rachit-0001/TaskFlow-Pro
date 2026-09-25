"use client";

export default function LoadingState({
  message = "Loading...",
}) {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <div className="text-center">

        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

        <p className="mt-4 text-sm text-slate-400">
          {message}
        </p>

      </div>
    </div>
  );
}