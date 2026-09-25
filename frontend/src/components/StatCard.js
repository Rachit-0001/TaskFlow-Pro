"use client";

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClass = "bg-blue-500/10 text-blue-400",
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {value}
          </p>

          {subtitle && (
            <p className="mt-2 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}