"use client";

export default function EmptyState({
  icon = "○",
  title = "Nothing here",
  description = "There is no data to display.",
  action = null,
}) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 px-6 py-10 text-center">
      <div>
        <div className="text-4xl text-slate-600">
          {icon}
        </div>

        <h3 className="mt-4 text-lg font-semibold text-slate-200">
          {title}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>

        {action && (
          <div className="mt-5">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}